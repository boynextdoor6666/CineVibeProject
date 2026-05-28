import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { exec } from 'child_process';
import * as path from 'path';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(Recommendation)
    private recommendationsRepository: Repository<Recommendation>,
    private dataSource: DataSource,
  ) {}

  async getRecommendationsForUser(userId: number, limit: number = 10) {
    return this.recommendationsRepository.find({
      where: { user_id: userId },
      relations: ['content'],
      order: { score: 'DESC' },
      take: limit,
    });
  }

  async getMlLogs() {
    try {
      const logs = await this.dataSource.query('SELECT * FROM ml_task_logs ORDER BY updated_at DESC');
      return logs;
    } catch (e) {
      return [];
    }
  }

  async generateRecommendations() {
    this.logger.log('Starting recommendation generation process...');
    
    // Resolve relative to where the application is run (movie-aggregator-backend-nest)
    // Using relative path directly prevents Windows path encoding issues (Cyrillic characters in path) with child_process
    const scriptPath = '../analytics/ml/recommender.py';
    
    return new Promise((resolve, reject) => {
      exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error executing ML script: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          this.logger.warn(`ML Script Stderr: ${stderr}`);
        }
        this.logger.log(`ML Script Output: ${stdout}`);
        resolve({ message: 'Recommendations generated successfully', output: stdout });
      });
    });
  }

  async predictRatings() {
    this.logger.log('Starting NLP rating predictor process...');
    
    // Resolve relative to where the application is run (movie-aggregator-backend-nest)
    const scriptPath = path.resolve(process.cwd(), '../analytics/ml/predict_rating.py');
    
    return new Promise((resolve, reject) => {
      exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error executing NLP script: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          this.logger.warn(`NLP Script Stderr: ${stderr}`);
        }
        this.logger.log(`NLP Script Output: ${stdout}`);
        resolve({ message: 'NLP Predictor finished successfully', output: stdout });
      });
    });
  }
}
