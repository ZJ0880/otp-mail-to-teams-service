import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AdminAuthGuard } from "../contexts/admin-auth/infrastructure/nest/admin-auth.guard";
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

interface RequestWithAdmin {
  admin: {
    adminId: string;
    username: string;
  };
}

@Controller("tickets")
@UseGuards(AdminAuthGuard)
@ApiBearerAuth("bearer")
export class TicketController {
  constructor(
    private readonly otpProcessingService: OtpProcessingService,
    private readonly manualOtpProcessingService: ManualOtpProcessingService,
    private readonly ticketRequestsService: TicketRequestsService,
  ) {}

  @Post("process")
  async processTickets(): Promise<OtpProcessingResult> {
    return this.otpProcessingService.processUnreadMessages();
  }

  @Post("process/manual")
  async processTicketsManual(@Body() input: ManualProcessTicketsDto): Promise<OtpProcessingResult> {
    return this.manualOtpProcessingService.processUnreadMessages(input);
  }

  @Get("requests")
  async listRequests(
    @Req() request: RequestWithAdmin,
    @Query() query: ListTicketRequestsQueryDto,
  ): Promise<TicketRequestListResponse> {
    return this.ticketRequestsService.listRequests(
      {
        userId: request.admin.adminId,
        username: request.admin.username,
        role: "ADMIN",
      },
      query,
    );
  }

  @Get("requests/:requestId")
  async getRequestById(
    @Req() request: RequestWithAdmin,
    @Param("requestId") requestId: string,
  ): Promise<TicketRequestDetailResponse> {
    return this.ticketRequestsService.getRequestById(
      {
        userId: request.admin.adminId,
        username: request.admin.username,
        role: "ADMIN",
      },
      requestId,
    );
  }

  @Post("requests")
  async createRequest(
    @Req() request: RequestWithAdmin,
    @Body() input: CreateTicketRequestDto,
  ): Promise<TicketRequestResponseItem> {
    return this.ticketRequestsService.createRequest(
      {
        userId: request.admin.adminId,
        username: request.admin.username,
        role: "ADMIN",
      },
      input,
    );
  }
}
