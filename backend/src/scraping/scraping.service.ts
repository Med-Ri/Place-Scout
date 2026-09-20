import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ScrapingService {
    constructor(private readonly httpService: HttpService) { }
}