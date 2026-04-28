import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { IdGeneratorPort } from "../../../../application/ports/out/id-generator.port";
import { CredentialRequestId } from "../../../../domain";

@Injectable()
export class CryptoIdGeneratorAdapter implements IdGeneratorPort {
  newCredentialRequestId(): CredentialRequestId {
    return CredentialRequestId.from(randomUUID());
  }
}