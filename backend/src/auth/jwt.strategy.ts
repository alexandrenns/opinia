import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret =
      process.env.JWT_SECRET || "opinia_jwt_secret_2024_very_secure";
    console.log(
      `[JwtStrategy] Inicializado com secret: "${secret.substring(0, 10)}..."`,
    );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log("[JwtStrategy] validate called, payload.sub:", payload?.sub);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
