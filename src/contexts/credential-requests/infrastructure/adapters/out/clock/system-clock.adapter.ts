import { Injectable } from "@nestjs/common";
import { ClockPort } from "../../../../application/ports/out/clock.port";
import { Instant } from "../../../../domain";

@Injectable()
export class SystemClockAdapter implements ClockPort {
  now(): Instant {
    return Instant.fromDate(new Date());
  }
}