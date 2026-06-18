import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../users/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Credenciais inválidas");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException("Credenciais inválidas");

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    const secret = process.env.JWT_SECRET || "NOT_SET";
    console.log(`[AuthService] JWT_SECRET: "${secret.substring(0, 10)}..."`);
    console.log(`[AuthService] Token gerado: ${token.substring(0, 30)}...`);

    return {
      access_token: token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async createAdminIfNotExists() {
    const existing = await this.userRepo.findOne({
      where: { email: "admin@opinia.com" },
    });
    if (!existing) {
      const hash = await bcrypt.hash("admin123", 10);
      await this.userRepo.save({
        email: "admin@opinia.com",
        password: hash,
        role: "admin",
      });
      console.log("✅ Admin criado: admin@opinia.com / admin123");
    } else {
      console.log("✅ Admin já existe:", existing.email);
    }
  }

  async changePassword(userId: string, senhaAtual: string, novaSenha: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Usuário não encontrado");

    const valid = await bcrypt.compare(senhaAtual, user.password);
    if (!valid) throw new UnauthorizedException("Senha atual incorreta");

    if (!novaSenha || novaSenha.length < 6) {
      throw new BadRequestException(
        "A nova senha deve ter pelo menos 6 caracteres",
      );
    }

    const hash = await bcrypt.hash(novaSenha, 10);
    await this.userRepo.update(user.id, { password: hash });
    return { message: "Senha alterada com sucesso!" };
  }
}
