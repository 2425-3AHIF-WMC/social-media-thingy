export interface IUser {
  id: number;
  name: string;
  role: string;
  email: string;
}

export interface ICharacter {
    id: number;
    value: string;
    name: string;
    description: string;
    image: string;
    variant: string;
}

export interface IRole {
    id: number;
    name: string;
}