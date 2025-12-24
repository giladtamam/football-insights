import { builder } from '../builder';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyGoogleToken,
  validatePassword,
  validateEmail,
} from '../../services/auth';

// Auth Response type
const AuthResponse = builder.objectRef<{
  token: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    avatar: string | null;
    authProvider: string;
  };
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

// Auth User type (subset of User for auth responses)
const AuthUser = builder.objectRef<{
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  authProvider: string;
}>('AuthUser');

builder.objectType(AuthUser, {
  fields: (t) => ({
    id: t.exposeInt('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    avatar: t.exposeString('avatar', { nullable: true }),
    authProvider: t.exposeString('authProvider'),
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
    },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.userId) {
        throw new Error('Authentication required');
      }

      const updateData: { name?: string; avatar?: string } = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.avatar !== undefined) updateData.avatar = args.avatar;

      const user = await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: updateData,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authProvider: user.authProvider,
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


