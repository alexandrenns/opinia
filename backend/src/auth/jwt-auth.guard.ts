import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];
    console.log(`\n[JWT Guard] ${request.method} ${request.url}`);
    console.log(
      `[JWT Guard] Authorization header: ${authHeader ? authHeader.substring(0, 40) + "..." : "AUSENTE"}`,
    );
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log(`[JWT Guard] user:`, user ? "OK" : "NULL");
    console.log(`[JWT Guard] err:`, err?.message || "none");
    console.log(`[JWT Guard] info:`, info?.message || info || "none");
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || "Token inválido");
    }
    return user;
  }
}
