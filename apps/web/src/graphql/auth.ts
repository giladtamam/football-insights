import { gql } from '@apollo/client'

const USER_FIELDS = `
  id
  email
  name
  avatar
  authProvider
  birthDate
  location
  bio
  timezone
  favoriteTeamId
  favoriteTeam {
    id
    name
    logo
  }
`

export const SIGN_UP = gql`
  mutation SignUp($email: String!, $password: String!, $name: String) {
    signUp(email: $email, password: $password, name: $name) {
      token
      user {
        ${USER_FIELDS}
      }
    }
  }
`

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        ${USER_FIELDS}
      }
    }
  }
`

export const GOOGLE_AUTH = gql`
  mutation GoogleAuth($idToken: String!) {
    googleAuth(idToken: $idToken) {
      token
      user {
        ${USER_FIELDS}
      }
    }
  }
`

export const GET_ME = gql`
  query GetMe {
    me {
      ${USER_FIELDS}
    }
  }
`

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile(
    $name: String
    $avatar: String
    $birthDate: DateTime
    $location: String
    $bio: String
    $timezone: String
    $favoriteTeamId: Int
  ) {
    updateProfile(
      name: $name
      avatar: $avatar
      birthDate: $birthDate
      location: $location
      bio: $bio
      timezone: $timezone
      favoriteTeamId: $favoriteTeamId
    ) {
      ${USER_FIELDS}
    }
  }
`

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`

// Query to search for teams (for favorite team selector)
export const SEARCH_TEAMS = gql`
  query SearchTeams($search: String!, $limit: Int) {
    teams(search: $search, limit: $limit) {
      id
      name
      logo
      country {
        name
        flag
      }
    }
  }
`



