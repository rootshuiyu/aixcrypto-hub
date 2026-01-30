import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { EsportsMatchDto } from '../esports.service';

type SportDevsMatch = {
  id: number;
  tournament_name?: string;
  league_name?: string;
  class_name?: string;
  status_type?: string;
  start_time?: string;
  specific_start_time?: string;
  home_team_id?: number;
  home_team_name?: string;
  home_team_hash_image?: string;
  away_team_id?: number;
  away_team_name?: string;
  away_team_hash_image?: string;
  home_team_score?: { current?: number; display?: number };
  away_team_score?: { current?: number; display?: number };
};

@Injectable()
export class SportDevsService {
  private readonly logger = new Logger(SportDevsService.name);
  private readonly baseUrl = 'https://esports.sportdevs.com';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SPORTDEVS_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('SportDevs API key not configured');
    }
  }

  async getLiveAndUpcomingMatches(limit = 50): Promise<EsportsMatchDto[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const [live, upcoming] = await Promise.all([
        this.fetchMatches('live', limit),
        this.fetchMatches('upcoming', limit),
      ]);

      const combined = [...live, ...upcoming];
      return combined
        .map((match) => this.mapMatch(match))
        .filter((match): match is EsportsMatchDto => !!match);
    } catch (error) {
      this.logger.error('Failed to fetch SportDevs matches', error);
      return [];
    }
  }

  private async fetchMatches(statusType: 'live' | 'upcoming', limit: number): Promise<SportDevsMatch[]> {
    const url = `${this.baseUrl}/matches`;
    const response = await firstValueFrom(
      this.httpService.get<SportDevsMatch[]>(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          status_type: `eq.${statusType}`,
          limit,
          offset: 0,
        },
      }),
    );

    return response.data || [];
  }

  private mapMatch(match: SportDevsMatch): EsportsMatchDto | null {
    const game = this.mapGame(match.class_name);
    if (!game) {
      return null;
    }

    const homeTeamName = match.home_team_name || 'Home';
    const awayTeamName = match.away_team_name || 'Away';

    const scheduledAtRaw = match.specific_start_time || match.start_time;
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : new Date();

    const statusType = (match.status_type || '').toLowerCase();
    const status = this.mapStatus(statusType);

    const baseOdds = 1.85;
    const variance = Math.random() * 0.4 - 0.2;
    const homeOdds = Math.round((baseOdds + variance) * 100) / 100;
    const awayOdds = Math.round((baseOdds - variance + 0.1) * 100) / 100;

    return {
      id: `sportdevs-${match.id}`,
      game,
      league: match.league_name || match.tournament_name || 'Unknown',
      tournament: match.tournament_name || undefined,
      homeTeam: {
        id: `sportdevs-team-${match.home_team_id || homeTeamName}`,
        name: homeTeamName,
        shortName: homeTeamName.slice(0, 4).toUpperCase(),
        logo: match.home_team_hash_image || undefined,
      },
      awayTeam: {
        id: `sportdevs-team-${match.away_team_id || awayTeamName}`,
        name: awayTeamName,
        shortName: awayTeamName.slice(0, 4).toUpperCase(),
        logo: match.away_team_hash_image || undefined,
      },
      bestOf: 1,
      scheduledAt,
      status,
      homeScore: match.home_team_score?.current ?? match.home_team_score?.display ?? 0,
      awayScore: match.away_team_score?.current ?? match.away_team_score?.display ?? 0,
      homeOdds,
      awayOdds,
      streamUrl: undefined,
    };
  }

  private mapGame(className?: string): 'LOL' | 'DOTA2' | 'CS2' | null {
    const name = (className || '').toLowerCase();
    if (name.includes('league') || name.includes('lol')) {
      return 'LOL';
    }
    if (name.includes('dota')) {
      return 'DOTA2';
    }
    if (name.includes('cs:go') || name.includes('csgo') || name.includes('counter')) {
      return 'CS2';
    }
    return null;
  }

  private mapStatus(statusType: string): EsportsMatchDto['status'] {
    if (statusType.includes('live')) {
      return 'LIVE';
    }
    if (statusType.includes('upcoming')) {
      return 'UPCOMING';
    }
    if (statusType.includes('postponed')) {
      return 'POSTPONED';
    }
    if (statusType.includes('canceled') || statusType.includes('cancelled')) {
      return 'CANCELLED';
    }
    return 'FINISHED';
  }
}
