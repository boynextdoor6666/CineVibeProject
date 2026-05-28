import { Repository, DataSource } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
export declare class RecommendationsService {
    private recommendationsRepository;
    private dataSource;
    private readonly logger;
    constructor(recommendationsRepository: Repository<Recommendation>, dataSource: DataSource);
    getRecommendationsForUser(userId: number, limit?: number): Promise<Recommendation[]>;
    getMlLogs(): Promise<any>;
    generateRecommendations(): Promise<unknown>;
    predictRatings(): Promise<unknown>;
}
