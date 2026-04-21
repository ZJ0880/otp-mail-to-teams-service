import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApprovalActionService } from "./approval-action.service";

@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvalActionService: ApprovalActionService) {}

  @Get(":token")
  async renderApprovalPage(@Param("token") token: string): Promise<string> {
    return this.approvalActionService.renderLandingPage(token);
  }

  @Post(":token/execute")
  async executeDecision(@Param("token") token: string): Promise<Record<string, unknown>> {
    return this.approvalActionService.executeDecision(token);
  }
}
