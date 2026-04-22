import { Instant } from "../../domain";

export interface ClockPort {
  now(): Instant;
}

