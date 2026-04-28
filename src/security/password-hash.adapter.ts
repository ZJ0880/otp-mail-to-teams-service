import { Injectable } from "@nestjs/common";
import { hashPassword } from "./password-hash";
import { PasswordHashPort } from "../contexts/users/application/ports/out/password-hash.port";

@Injectable()
export class PasswordHashAdapter implements PasswordHashPort {
  hash(password: string): string {
    return hashPassword(password);
  }
}
