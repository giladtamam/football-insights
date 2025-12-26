import { builder } from '../builder';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyGoogleToken,
  validatePassword,
  validateEmail,
} from '../../services/auth';

// Auth User type (subset of User for auth responses)
interface AuthUserType {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  authProvider: string;
  birthDate: Date | null;
  location: string | null;
  bio: string | null;
  timezone: string | null;
  favoriteTeamId: number | null;
  favoriteTeam: { id: number; name: string; logo: string | null } | null;
}

const AuthUser = builder.objectRef<AuthUserType>('AuthUser');

builder.objectType(AuthUser, {
  fields: (t) => ({
    id: t.exposeInt('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    avatar: t.exposeString('avatar', { nullable: true }),
    authProvider: t.exposeString('authProvider'),
    birthDate: t.expose('birthDate', { type: 'DateTime', nullable: true }),
    location: t.exposeString('location', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    timezone: t.exposeString('timezone', { nullable: true }),
    favoriteTeamId: t.exposeInt('favoriteTeamId', { nullable: true }),
    favoriteTeam: t.field({
      type: FavoriteTeamRef,
      nullable: true,
      resolve: (parent) => parent.favoriteTeam,
    }),
  }),
});

// Favorite Team reference type
const FavoriteTeamRef = builder.objectRef<{
  id: number;
  name: string;
  logo: string | null;
}>('FavoriteTeamRef');

builder.objectType(FavoriteTeamRef, {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    logo: t.exposeString('logo', { nullable: true }),
  }),
});

// Auth Response type
const AuthResponse = builder.objectRef<{
  token: string;
  user: AuthUserType;
}>('AuthResponse');

builder.objectType(AuthResponse, {
  fields: (t) => ({
    token: t.exposeString('token'),
    user: t.field({
      type: AuthUser,
      resolve: (parent) => parent.user,
    }),
  }),
});

// Sign Up with Email
builder.mutationField('signUp', (t) =>
  t.field({
    type: AuthResponse,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
      name: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      // Validate email
      if (!validateEmail(args.email)) {
        throw new Error('Invalid email address');
      }

      // Validate password
      const passwordValidation = validatePassword(args.password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join('. '));
      }

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Hash password and create user
      const passwordHash = await hashPassword(args.password);

      const user = await ctx.prisma.user.create({
        data: {
          email: args.email.toLowerCase(),
          name: args.name || null,
          passwordHash,
          authProvider: 'email',
          emailVerified: false,
        },
      });

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          authProvider: user.authProvider,
          birthDate: user.birthDate,
          location: user.location,
          bio: user.bio,
          timezone: user.timezone,
          favoriteTeamId: user.favoriteTeamId,
          favoriteTeam: null,
        },
      };
    },
  })
);

// Login with Email
builder.mutationField('login', (t) =>
  t.field({
    type: AuthResponse,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user signed up with Google
      if (!user.passwordHash) {
        throw new Error('This account uses Google Sign-In. Please use the Google button to log in.');
      }

      // Verify password
      const isValid = await verifyPassword(args.password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Get favorite team if exists
      let favoriteTeam = null;
      if (user.favoriteTeamId) {
        const team = await ctx.prisma.team.findUnique({
          where: { id: user.favoriteTeamId },
          select: { id: true, name: true, logo: true },
        });
        favoriteTeam = team;
      }

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          authProvider: user.authProvider,
          birthDate: user.birthDate,
          location: user.location,
          bio: user.bio,
          timezone: user.timezone,
          favoriteTeamId: user.favoriteTeamId,
          favoriteTeam,
        },
      };
    },
  })
);

// Google Sign-In
builder.mutationField('googleAuth', (t) =>
  t.field({
    type: AuthResponse,
    args: {
      idToken: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      // Verify Google token
      const googleUser = await verifyGoogleToken(args.idToken);
      
      if (!googleUser) {
        throw new Error('Invalid Google token');
      }

      // Find or create user
      let user = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleUser.googleId },
            { email: googleUser.email.toLowerCase() },
          ],
        },
      });

      if (user) {
        // Update Google ID if not set (linking existing email account)
        if (!user.googleId) {
          user = await ctx.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUser.googleId,
              avatar: user.avatar || googleUser.picture,
              emailVerified: true,
            },
          });
        }
      } else {
        // Create new user
        user = await ctx.prisma.user.create({
          data: {
            email: googleUser.email.toLowerCase(),
            name: googleUser.name,
            avatar: googleUser.picture,
            googleId: googleUser.googleId,
            authProvider: 'google',
            emailVerified: true,
          },
        });
      }

      // Get favorite team if exists
      let favoriteTeam = null;
      if (user.favoriteTeamId) {
        const team = await ctx.prisma.team.findUnique({
          where: { id: user.favoriteTeamId },
          select: { id: true, name: true, logo: true },
        });
        favoriteTeam = team;
      }

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          authProvider: user.authProvider,
          birthDate: user.birthDate,
          location: user.location,
          bio: user.bio,
          timezone: user.timezone,
          favoriteTeamId: user.favoriteTeamId,
          favoriteTeam,
        },
      };
    },
  })
);

// Get current user (requires auth)
builder.queryField('me', (t) =>
  t.field({
    type: AuthUser,
    nullable: true,
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.userId) {
        return null;
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        include: {
          favoriteTeam: {
            select: { id: true, name: true, logo: true },
          },
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authProvider: user.authProvider,
        birthDate: user.birthDate,
        location: user.location,
        bio: user.bio,
        timezone: user.timezone,
        favoriteTeamId: user.favoriteTeamId,
        favoriteTeam: user.favoriteTeam,
      };
    },
  })
);

// Update profile
builder.mutationField('updateProfile', (t) =>
  t.field({
    type: AuthUser,
    args: {
      name: t.arg.string({ required: false }),
      avatar: t.arg.string({ required: false }),
      birthDate: t.arg({ type: 'DateTime', required: false }),
      location: t.arg.string({ required: false }),
      bio: t.arg.string({ required: false }),
      timezone: t.arg.string({ required: false }),
      favoriteTeamId: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Authentication required');
      }

      const updateData: {
        name?: string | null;
        avatar?: string | null;
        birthDate?: Date | null;
        location?: string | null;
        bio?: string | null;
        timezone?: string | null;
        favoriteTeamId?: number | null;
      } = {};

      if (args.name !== undefined) updateData.name = args.name;
      if (args.avatar !== undefined) updateData.avatar = args.avatar;
      if (args.birthDate !== undefined) updateData.birthDate = args.birthDate;
      if (args.location !== undefined) updateData.location = args.location;
      if (args.bio !== undefined) updateData.bio = args.bio;
      if (args.timezone !== undefined) updateData.timezone = args.timezone;
      if (args.favoriteTeamId !== undefined) updateData.favoriteTeamId = args.favoriteTeamId;

      // Validate favorite team exists if provided
      if (args.favoriteTeamId) {
        const team = await ctx.prisma.team.findUnique({
          where: { id: args.favoriteTeamId },
        });
        if (!team) {
          throw new Error('Team not found');
        }
      }

      const user = await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: updateData,
        include: {
          favoriteTeam: {
            select: { id: true, name: true, logo: true },
          },
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authProvider: user.authProvider,
        birthDate: user.birthDate,
        location: user.location,
        bio: user.bio,
        timezone: user.timezone,
        favoriteTeamId: user.favoriteTeamId,
        favoriteTeam: user.favoriteTeam,
      };
    },
  })
);

// Change password (for email users)
builder.mutationField('changePassword', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      currentPassword: t.arg.string({ required: true }),
      newPassword: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Authentication required');
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Cannot change password for this account');
      }

      // Verify current password
      const isValid = await verifyPassword(args.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = validatePassword(args.newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join('. '));
      }

      // Update password
      const newHash = await hashPassword(args.newPassword);
      await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: { passwordHash: newHash },
      });

      return true;
    },
  })
);



