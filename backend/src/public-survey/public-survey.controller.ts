import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { PublicSurveyService } from './public-survey.service';

@Controller('s')
export class PublicSurveyController {
  constructor(private service: PublicSurveyService) {}

  @Get(':token')
  getSurvey(@Param('token') token: string) {
    return this.service.getSurveyByToken(token);
  }

  @Post(':token/responder')
  submitResposta(
    @Param('token') token: string,
    @Body() body: { respostas: any },
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';
    return this.service.submitResposta(token, body.respostas, ip);
  }
}
