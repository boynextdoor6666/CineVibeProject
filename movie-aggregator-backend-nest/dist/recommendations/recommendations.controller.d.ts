import { RecommendationsService } from './recommendations.service';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    getMyRecommendations(req: any): Promise<import("./entities/recommendation.entity").Recommendation[]>;
    getMlLogs(): Promise<any>;
    generateRecommendations(): Promise<unknown>;
    predictRatings(): Promise<unknown>;
}
