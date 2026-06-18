import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Put("change-password")
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req: any,
    @Body() body: { senhaAtual: string; novaSenha: string },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      body.senhaAtual,
      body.novaSenha,
    );
  }

  @Get("setup")
  setup() {
    return this.authService.createAdminIfNotExists();
  }
}
