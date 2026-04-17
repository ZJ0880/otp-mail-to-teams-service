import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { TokenAuthGuard } from "../auth/token-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ManualProcessTicketsDto } from "./manual-process.dto";
import { ManualOtpProcessingService } from "./manual-otp-processing.service";
import { OtpProcessingResult, OtpProcessingService } from "./otp-processing.service";
import {
  CreateTicketRequestDto,
  TicketRequestDetailResponse,
  ListTicketRequestsQueryDto,
  TicketRequestListResponse,
  TicketRequestResponseItem,
} from "./ticket-requests.dto";
import { TicketRequestsService } from "./ticket-requests.service";

interface RequestWithUser {
  user: {
    userId: string;
    username: string;
    role: "ADMIN" | "OPERATOR" | "VIEWER";
  };
}

@Controller("tickets")
@UseGuards(TokenAuthGuard, RolesGuard)
export class TicketController {
  constructor(
    private readonly otpProcessingService: OtpProcessingService,
    private readonly manualOtpProcessingService: ManualOtpProcessingService,
    private readonly ticketRequestsService: TicketRequestsService,
  ) {}

  @Post("process")
  @Roles("ADMIN", "OPERATOR")
  async processTickets(): Promise<OtpProcessingResult> {
    return this.otpProcessingService.processUnreadMessages();
  }

  @Post("process/manual")
  @Roles("ADMIN", "OPERATOR")
  async processTicketsManual(@Body() input: ManualProcessTicketsDto): Promise<OtpProcessingResult> {
    return this.manualOtpProcessingService.processUnreadMessages(input);
  }

  @Get("requests")
  @Roles("ADMIN", "OPERATOR", "VIEWER")
  async listRequests(
    @Req() request: RequestWithUser,
    @Query() query: ListTicketRequestsQueryDto,
  ): Promise<TicketRequestListResponse> {
    return this.ticketRequestsService.listRequests(request.user, query);
  }

  @Get("requests/:requestId")
  @Roles("ADMIN", "OPERATOR", "VIEWER")
  async getRequestById(
    @Req() request: RequestWithUser,
    @Param("requestId") requestId: string,
  ): Promise<TicketRequestDetailResponse> {
    return this.ticketRequestsService.getRequestById(request.user, requestId);
  }

  @Post("requests")
  @Roles("ADMIN", "OPERATOR")
  async createRequest(
    @Req() request: RequestWithUser,
    @Body() input: CreateTicketRequestDto,
  ): Promise<TicketRequestResponseItem> {
    return this.ticketRequestsService.createRequest(request.user, input);
  }
}
