import React, { useState, useEffect, useMemo, useRef } from 'react';
import allNbaCsv from './data/all-nba.csv?raw';
import allRookieCsv from './data/all-rookie.csv?raw';
import allDefenseCsv from './data/all-defense.csv?raw';
import { Presentation, Search, X, Loader2, Trophy, Dribbble, AlertCircle, User, Play, CheckCircle, XCircle, Copy, RotateCcw, Crown, Ticket, TrendingDown, Circle, FastForward, ListOrdered, ClipboardList, Lock, Tag, Plus, TableOfContents , Twitter, Mail , Send, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import questionBank from './data/questions.json';
import top100Data from './data/top100.json';
import { supabase } from './lib/supabase';
import { saveGame, fetchGames, isSupabaseConfigured } from './lib/db';
import LZString from 'lz-string';
import logoImg from "./logo.png";

// --- Top-100 legend cap (nostalgia mechanic) ---
// A daily board may include at most MAX_LEGENDS_PER_BOARD slots whose single best
// (highest-scoring) answer is one of the all-time Top-100 players. This prevents
// the board from being saturated with superstar-optimal questions.
const LEGEND_NAMES: Set<string> = new Set(
  (top100Data.players || []).map((p: { name: string }) => p.name)
);
const MAX_LEGENDS_PER_BOARD: number = top100Data.maxLegendsPerBoard ?? 3;

const normalizeString = (str: string) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const getPlayerKey = (name: string) => {
  return normalizeString(name)
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/(jr|sr|iii|ii)$/, '');
};

const HoopIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 14V8c0-3 3-5 9-5s9 2 9 5v6l-4 2H7l-4-2z" />
    <rect x="8" y="9" width="8" height="7" />
    <line x1="6" y1="16" x2="18" y2="16" strokeWidth="2" />
    <path d="M8 16l1.5 7h5l1.5-7" />
    <path d="M10.5 16l3 7" />
  </svg>
);

const TeamworkIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
  >
    <path d="M16,18c-4.411,0-8,3.589-8,8v3c0,0.552,0.448,1,1,1h14c0.552,0,1-0.448,1-1v-3C24,21.589,20.411,18,16,18z M22,28h-2v-1 c0-0.552-0.448-1-1-1s-1,0.448-1,1v1h-4v-1c0-0.552-0.448-1-1-1s-1,0.448-1,1v1h-2v-2c0-3.309,2.691-6,6-6s6,2.691,6,6V28z"/>
    <path d="M12,12.138v1.724C12,15.592,13.408,17,15.138,17h1.724C18.592,17,20,15.592,20,13.862v-1.724C20,10.408,18.592,9,16.862,9 h-1.724C13.408,9,12,10.408,12,12.138z M14,12.138C14,11.511,14.511,11,15.138,11h1.724C17.489,11,18,11.511,18,12.138v1.724 C18,14.489,17.489,15,16.862,15h-1.724C14.511,15,14,14.489,14,13.862V12.138z"/>
    <path d="M22,11c-0.552,0-1,0.448-1,1s0.448,1,1,1c3.309,0,6,2.691,6,6v2h-2v-1c0-0.552-0.448-1-1-1s-1,0.448-1,1v2 c0,0.552,0.448,1,1,1h4c0.552,0,1-0.448,1-1v-3C30,14.589,26.411,11,22,11z"/>
    <path d="M21.138,10h1.724C24.592,10,26,8.592,26,6.862V5.138C26,3.408,24.592,2,22.862,2h-1.724C19.408,2,18,3.408,18,5.138v1.724 C18,8.592,19.408,10,21.138,10z M20,5.138C20,4.511,20.511,4,21.138,4h1.724C23.489,4,24,4.511,24,5.138v1.724 C24,7.489,23.489,8,22.862,8h-1.724C20.511,8,20,7.489,20,6.862V5.138z"/>
    <path d="M3,23h4c0.552,0,1-0.448,1-1v-2c0-0.552-0.448-1-1-1s-1,0.448-1,1v1H4v-2c0-3.309,2.691-6,6-6c0.552,0,1-0.448,1-1 s-0.448-1-1-1c-4.411,0-8,3.589-8,8v3C2,22.552,2.448,23,3,23z"/>
    <path d="M9.138,10h1.724C12.592,10,14,8.592,14,6.862V5.138C14,3.408,12.592,2,10.862,2H9.138C7.408,2,6,3.408,6,5.138v1.724 C6,8.592,7.408,10,9.138,10z M8,5.138C8,4.511,8.511,4,9.138,4h1.724C11.489,4,12,4.511,12,5.138v1.724C12,7.489,11.489,8,10.862,8 H9.138C8.511,8,8,7.489,8,6.862V5.138z"/>
  </svg>
);

const DraftsIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 4H3" />
    <path d="M10 10H3" />
    <path d="M6 16H3" />
    <path d="M19.5 2.5a2.121 2.121 0 0 1 3 3L11 17l-4.5 1.5 1.5-4.5Z" />
    <path d="M17 5l3 3" />
  </svg>
);

const JerseyIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 3h12l2 6v12H4V9z" />
    <path d="M8 3v4a4 4 0 0 0 8 0V3" />
  </svg>
);

const BracketStarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 13.54 5.13 17 5.63 14.5 8.07 15.09 11.51 12 9.88 8.91 11.51 9.5 8.07 7 5.63 10.45 5.13" fill="currentColor" />
    <path d="M12 11.5v3" />
    <path d="M7 17.5v-3h10v3" />
    <path d="M4 20.5v-3h6v3" />
    <path d="M14 20.5v-3h6v3" />
  </svg>
);


type SeasonData = {
  season: string;
  team: string;
  pos: string;
  g: number;
  pts: number;
  trb: number;
  ast: number;
  stl: number;
  blk: number;
  mpr8: number;
};

const normalizeSeason = (s: string) => {
  if (!s) return s;
  const match = s.match(/^(\d{4})-(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2].substring(2)}`;
  }
  return s;
};

const formatSeasonDisplay = (year: string) => {
  if (!year || isNaN(parseInt(year, 10))) return year;
  const endYear = parseInt(year, 10);
  const startYear = endYear - 1;
  return `${startYear}-${endYear.toString().slice(2)}`;
};

const seasonToAllStarYear = (seasonString: string): number => {
  if (seasonString.includes('-')) {
    const parts = seasonString.split('-');
    const startYear = parseInt(parts[0], 10);
    return startYear + 1;
  }
  return parseInt(seasonString, 10);
};

const awardsBank: Record<string, Record<string, { season: string, team: string }[]>> = {};

const TEAM_ALIASES: Record<string, string> = {
  'SFW': 'GSW', 'PHW': 'GSW', // Warriors
  'NJN': 'BKN', 'NYA': 'BKN', 'BRK': 'BKN', // Nets
  'CHH': 'CHA', 'CHO': 'CHA', // Hornets / Bobcats
  'NOH': 'NOP', 'NOK': 'NOP', // Pelicans / NO Hornets
  'WSB': 'WAS', 'BAL': 'WAS', 'CHZ': 'WAS', 'CAP': 'WAS', // Wizards / Bullets
  'SDC': 'LAC', 'BUF': 'LAC', // Clippers / Braves
  'KCK': 'SAC', 'CIN': 'SAC', 'ROC': 'SAC', // Kings / Royals
  'VAN': 'MEM', // Grizzlies
  'SYR': 'PHI', // 76ers / Nationals
  'MNL': 'LAL', // Lakers
  'NOJ': 'UTA', // Jazz
  'DLC': 'SAS', // Spurs / Chaparrals
};

// DISPLAY-ONLY team-code map for the end-of-game "Top 10 Answers" badges.
// NOTE: this is purely cosmetic and is NOT used for any game logic / franchise
// filtering (that still uses TEAM_ALIASES above). It KEEPS a handful of iconic,
// genuinely-distinct legacy identities as nostalgic throwbacks and NORMALIZES the
// rest so a single question's Top-10 list never shows mixed codes for one team
// (e.g. a 2000s Charlotte list won't mix CHA/CHO).
const DISPLAY_TEAM_NORMALIZE: Record<string, string> = {
  // Charlotte: keep CHH (90s teal Hornets); collapse modern CHO into CHA
  'CHO': 'CHA',
  // Nets: keep NJN (New Jersey era); fold early/spelling variants into it or BKN
  'BRK': 'BKN', 'NYA': 'NJN', 'NYN': 'NJN',
  // Washington: fully unified (Bullets/Wizards share the same visual identity)
  'WSB': 'WAS', 'BAL': 'WAS', 'CAP': 'WAS', 'CHZ': 'WAS',
  // Kings lineage -> SAC (Kansas City Kings not kept as throwback)
  'KCK': 'SAC', 'KCO': 'SAC', 'CIN': 'SAC', 'ROC': 'SAC',
  // Clippers lineage -> LAC (San Diego not kept as throwback)
  'SDC': 'LAC', 'SDR': 'LAC', 'BUF': 'LAC',
  // Warriors precursors
  'PHW': 'GSW', 'SFW': 'GSW',
  // Other obscure pre-modern identities
  'MNL': 'LAL', 'SYR': 'PHI', 'DLC': 'SAS', 'NOJ': 'UTA', 'NOK': 'NOP',
};
// Iconic identities intentionally shown AS-IS (throwback flavor): SEA, VAN, NJN, CHH, NOH.
const displayTeam = (code: string): string => {
  if (!code) return code;
  return DISPLAY_TEAM_NORMALIZE[code] || code;
};

const parseAwardsCsv = (csvText: string, type: string) => {
  const lines = csvText.trim().split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols: string[] = [];
    let inQuotes = false;
    let val = '';
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (inQuotes) {
        if (char === '"') inQuotes = false;
        else val += char;
      } else {
        if (char === '"') inQuotes = true;
        else if (char === ',') {
          cols.push(val);
          val = '';
        } else {
          val += char;
        }
      }
    }
    cols.push(val);

    if (cols.length < 4) continue;
    const season = cols[0];
    const rawTeam = cols[2];
    const team = TEAM_ALIASES[rawTeam] || rawTeam;
    
    for (let k = 4; k < cols.length; k++) {
      let pStr = cols[k].trim();
      if (!pStr) continue;
      
      let pNames = [pStr];
      if (pStr.includes('(T)')) {
         pNames = pStr.replace('(T)', '').split(',').map(s => s.trim());
      }
      
      pNames.forEach(name => {
         let cleanName = name.replace(/ [CFG]$/, '').trim();
         let key = getPlayerKey(cleanName);
         if (!awardsBank[key]) {
           awardsBank[key] = { "All-NBA": [], "All-Rookie": [], "All-Defense": [] };
         }
         awardsBank[key][type].push({ season, team });
      });
    }
  }
};

parseAwardsCsv(allNbaCsv, 'All-NBA');
parseAwardsCsv(allRookieCsv, 'All-Rookie');
parseAwardsCsv(allDefenseCsv, 'All-Defense');

type Player = {
  id: string;
  name: string;
  lowerName: string;
  eligiblePositions: string[];
  seasons: SeasonData[];
  draftYear: number | null;
  draftRound: number | null;
  draftPick: number | null;
  allStarYears: number[];
};

type SlotPlayer = {
  playerId: string;
  name: string;
  season: string;
  team: string;
  pos: string;
  mpr8: number;
  eligiblePositions?: string[];
};

type FilterCriteria = {
  award?: string;
  awardDecade?: string | number;
  awardTeam?: string;
  awardSeason?: string;
  team?: string;
  pos?: string;
  exclude?: string[];
  minPick?: number;
  maxPick?: number;
  minBlk?: number;
  minStl?: number;
  minBlkOrStl?: number;
  conf?: string;
  teamDecade?: { team: string, minYear: number, maxYear: number };
  seasonYear?: number;
  minTrb?: number;
  playedInDecade?: number;
  excludePick?: number;
  excludeFirstName?: string;
  pick?: number;
  draftYearDecade?: number;
  minTeams?: number;
  minPts?: number;
  maxPts?: number;
  minAst?: number;
  draftRound?: number;
  minAwards?: number;
  teammateWith?: { name: string, team: string, minYear: number, maxYear: number };
  excludePos?: string | string[];
  draftYear?: number;
};

type CustomSlotConfig = {
  pos: string;
  teamOrConf: string;
  statOrAward: string;
  decade: string;
  exclude: string[];
  draftYear?: string;
};

const EXCEPTION_QUALIFIERS = [
  "Drafted outside the lottery (Pick 15+)",
  "Drafted in the Top 10",
  "Drafted in the Top 5",
  "Selected First Overall"
];

const DRAFT_PHRASING_MAP: Record<string, string> = {
  "drafted outside the lottery (pick 15+)": "drafted outside the lottery (Pick 15+)",
  "drafted in the top 10": "selected in the Top 10 of the NBA Draft",
  "drafted in the top 5": "selected in the Top 5 of the NBA Draft",
  "selected first overall": "selected #1 overall in the NBA Draft"
};

const STAT_AWARD_OPTIONS = [
  { val: '', label: 'N/A (Select Criteria)' },
  { val: 'All-Star', label: 'was an All-Star' },
  { val: 'All-NBA', label: 'made All-NBA' },
  { val: 'All-Defense', label: 'made All-Defense' },
  { val: '20+ PTS', label: 'averaged 20+ PPG' },
  { val: '15+ PTS', label: 'averaged 15+ PPG' },
  { val: '10+ PTS', label: 'averaged 10+ PPG' },
  { val: '<10 PTS', label: 'averaged <10 PPG' },
  { val: '10+ TRB', label: 'averaged 10+ RPG' },
  { val: '8+ TRB', label: 'averaged 8+ RPG' },
  { val: '4+ TRB', label: 'averaged 4+ RPG' },
  { val: '10+ AST', label: 'averaged 10+ APG' },
  { val: '7+ AST', label: 'averaged 7+ APG' },
  { val: '4+ AST', label: 'averaged 4+ APG' },
  { val: '2+ STL', label: 'averaged 2+ SPG' },
  { val: '1+ STL', label: 'averaged 1+ SPG' },
  { val: '2+ BLK', label: 'averaged 2+ BPG' },
  { val: '1+ BLK', label: 'averaged 1+ BPG' },
];

const buildCustomFilterCriteria = (config: CustomSlotConfig): FilterCriteria => {
  const fc: FilterCriteria = {};
  if (config.pos && config.pos !== '') {
    fc.pos = config.pos;
  }
  
  if (config.teamOrConf && config.teamOrConf !== '') {
    if (config.teamOrConf === 'EAST' || config.teamOrConf === 'WEST') {
      fc.conf = config.teamOrConf;
    } else {
      fc.team = config.teamOrConf;
    }
  }

  if (config.decade && config.decade !== '') {
    fc.playedInDecade = parseInt(config.decade, 10);
  }

  if (config.draftYear && config.draftYear !== '') {
    fc.draftYear = parseInt(config.draftYear, 10);
  }

  if (config.statOrAward && config.statOrAward !== '') {
    if (config.statOrAward === '20+ PTS') fc.minPts = 20;
    else if (config.statOrAward === '15+ PTS') fc.minPts = 15;
    else if (config.statOrAward === '10+ PTS') fc.minPts = 10;
    else if (config.statOrAward === '<10 PTS') fc.maxPts = 10;
    else if (config.statOrAward === '10+ AST') fc.minAst = 10;
    else if (config.statOrAward === '7+ AST') fc.minAst = 7;
    else if (config.statOrAward === '4+ AST') fc.minAst = 4;
    else if (config.statOrAward === '10+ TRB') fc.minTrb = 10;
    else if (config.statOrAward === '8+ TRB') fc.minTrb = 8;
    else if (config.statOrAward === '4+ TRB') fc.minTrb = 4;
    else if (config.statOrAward === '2+ STL') fc.minStl = 2;
    else if (config.statOrAward === '1+ STL') fc.minStl = 1;
    else if (config.statOrAward === '2+ BLK') fc.minBlk = 2;
    else if (config.statOrAward === '1+ BLK') fc.minBlk = 1;
    else fc.award = config.statOrAward;
  }
  
  if (config.exclude && config.exclude.length > 0) {
    const playerExcludes: string[] = [];
    config.exclude.forEach(ex => {
      const lower = ex.toLowerCase();
      if (lower === "drafted outside the lottery (pick 15+)") {
        fc.minPick = 15;
      } else if (lower === "drafted in the top 10") {
        fc.maxPick = 10;
      } else if (lower === "drafted in the top 5") {
        fc.maxPick = 5;
      } else if (lower === "selected first overall") {
        fc.pick = 1;
      } else {
        playerExcludes.push(ex);
      }
    });
    if (playerExcludes.length > 0) {
      fc.exclude = playerExcludes;
    }
  }

  return fc;
};

type GMStats = {
  gmName: string;
  gamesPlayed: number;
  averageScore: number;
  totalSkips: number;
  dynastyCount: number;
  globalRank: number;
};

type Slot = {
  id: string;
  difficulty?: 'warmup' | 'medium' | 'hoophead';
  type: 'G' | 'F' | 'C' | 'W' | 'ANY';
  label: string;
  question: string;
  filterCriteria?: FilterCriteria;
  player: SlotPlayer | null;
  isValid: boolean | null;
  theme?: string;
  decadeLabel?: string;
};

const SLOT_ALLOWED_POSITIONS: Record<number, string[]> = {
  0: ['PG', 'SG'],
  1: ['SG', 'SF', 'PG'],
  2: ['SF', 'SG'],
  3: ['SF', 'PF', 'C'],
  4: ['C', 'PF'],
  5: ['PG', 'SG'],
  6: ['SF', 'PF'],
  7: ['C', 'PF'],
};

const getAllowedPositionsForSlot = (slot: Slot, activeIndex: number): string[] => {
  // 1. If explicit position criteria exists in filterCriteria, use it
  if (slot?.filterCriteria?.pos) {
    const p = slot.filterCriteria.pos;
    if (p === 'G') return ['PG', 'SG'];
    if (p === 'W') return ['SF', 'SG'];
    if (p === 'F') return ['SF', 'PF'];
    if (p === 'C') return ['C', 'PF'];
    if (p === 'F/C' || p === 'FC') return ['SF', 'PF', 'C'];
    if (p === 'ANY') return ['PG', 'SG', 'SF', 'PF', 'C'];
    return [p];
  }

  // 2. If the slot explicitly allows ANY position, return all positions
  if (slot?.type === 'ANY') {
    return ['PG', 'SG', 'SF', 'PF', 'C'];
  }

  // 3. Fallback to standard slot layout only if activeIndex is valid
  if (activeIndex >= 0 && SLOT_ALLOWED_POSITIONS[activeIndex]) {
    return SLOT_ALLOWED_POSITIONS[activeIndex];
  }

  // 4. Default open
  return ['PG', 'SG', 'SF', 'PF', 'C'];
};

const isPositionMatch = (posCriteria: string, positions: string[]): boolean => {
  if (!posCriteria) return true;
  if (posCriteria === 'W') return positions.some(p => ['SF', 'SG'].includes(p));
  if (posCriteria === 'G') return positions.some(p => ['PG', 'SG'].includes(p));
  if (posCriteria === 'F') return positions.some(p => ['SF', 'PF'].includes(p));
  if (posCriteria === 'C') return positions.some(p => ['C', 'PF'].includes(p));
  if (posCriteria === 'F/C' || posCriteria === 'FC') return positions.some(p => ['SF', 'PF', 'C'].includes(p));
  return positions.includes(posCriteria);
};

const getEligiblePositions = (playerSeasons: SeasonData[]): string[] => {
  const counts: Record<string, number> = {};
  playerSeasons.forEach(season => {
    if (season.pos) {
      const positions = season.pos.split('-');
      positions.forEach(p => {
        const pos = p.trim();
        if (['PG', 'SG', 'SF', 'PF', 'C'].includes(pos)) {
          counts[pos] = (counts[pos] || 0) + 1;
        }
      });
    }
  });
  
  // FIX: If a player has only 1 season total (like incoming rookies), 
  // allow their position(s) immediately without requiring 2 seasons.
  if (playerSeasons.length === 1) {
    return Object.keys(counts);
  }

  return Object.keys(counts).filter(pos => counts[pos] >= 2);
};

const getMajorityPosition = (playerSeasons: SeasonData[]): string => {
  if (playerSeasons.length === 0) return '';
  const counts: Record<string, number> = {};
  playerSeasons.forEach(season => {
    const pos = season.pos; 
    counts[pos] = (counts[pos] || 0) + 1;
  });
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
};

const getPickGrade = (score: number, topPicks: { mpr8: number }[]): string => {
   if (!topPicks || topPicks.length === 0) return 'N/A';
   
   const maxScore = topPicks[0].mpr8;
   if (maxScore <= 0) return 'N/A';
   
   const ratio = (score / maxScore) * 100;

   if (ratio >= 95) return 'A+';
   if (ratio >= 90) return 'A';
   if (ratio >= 85) return 'A-';
   if (ratio >= 75) return 'B+';
   if (ratio >= 65) return 'B';
   if (ratio >= 55) return 'B-';
   if (ratio >= 45) return 'C+';
   if (ratio >= 35) return 'C';
   if (ratio >= 25) return 'C-';
   if (ratio >= 15) return 'D+';
   if (ratio >= 10) return 'D';
   if (ratio >= 5) return 'D-';
   return 'F';
};

const getGradeStyles = (grade: string) => {
    return { circle: 'bg-blue-950 border-blue-800', text: 'text-[#f54646]', label: 'text-blue-500/80' };
};

const TEAM_CONFERENCES: Record<string, string> = {
  'ATL': 'EAST', 'BOS': 'EAST', 'BKN': 'EAST', 'CHA': 'EAST', 'CHI': 'EAST', 
  'CLE': 'EAST', 'DET': 'EAST', 'IND': 'EAST', 'MIA': 'EAST', 'MIL': 'EAST', 
  'NYK': 'EAST', 'ORL': 'EAST', 'PHI': 'EAST', 'TOR': 'EAST', 'WAS': 'EAST',
  'NJN': 'EAST', 'CHH': 'EAST', 'CHO': 'EAST', 'WSB': 'EAST', 'CAP': 'EAST', 
  'BAL': 'EAST', 'BUF': 'EAST', 'SYR': 'EAST', 'CIN': 'EAST', 'ROC': 'EAST', 'NYN': 'EAST',
  'DAL': 'WEST', 'DEN': 'WEST', 'GSW': 'WEST', 'HOU': 'WEST', 'LAC': 'WEST', 
  'LAL': 'WEST', 'MEM': 'WEST', 'MIN': 'WEST', 'NOP': 'WEST', 'OKC': 'WEST', 
  'PHO': 'WEST', 'POR': 'WEST', 'SAC': 'WEST', 'SAS': 'WEST', 'UTA': 'WEST',
  'SEA': 'WEST', 'VAN': 'WEST', 'NOH': 'WEST', 'NOK': 'WEST', 'KCK': 'WEST', 
  'KCO': 'WEST', 'SDC': 'WEST', 'SDR': 'WEST', 'SFW': 'WEST', 'MNL': 'WEST', 'NOJ': 'WEST'
};

const FRANCHISES = [
  { code: 'ATL', name: 'Atlanta Hawks' },
  { code: 'BOS', name: 'Boston Celtics' },
  { code: 'BKN', name: 'Brooklyn Nets' },
  { code: 'CHA', name: 'Charlotte Hornets' },
  { code: 'CHI', name: 'Chicago Bulls' },
  { code: 'CLE', name: 'Cleveland Cavaliers' },
  { code: 'DAL', name: 'Dallas Mavericks' },
  { code: 'DEN', name: 'Denver Nuggets' },
  { code: 'DET', name: 'Detroit Pistons' },
  { code: 'GSW', name: 'Golden State Warriors' },
  { code: 'HOU', name: 'Houston Rockets' },
  { code: 'IND', name: 'Indiana Pacers' },
  { code: 'LAC', name: 'Los Angeles Clippers' },
  { code: 'LAL', name: 'Los Angeles Lakers' },
  { code: 'MEM', name: 'Memphis Grizzlies' },
  { code: 'MIA', name: 'Miami Heat' },
  { code: 'MIL', name: 'Milwaukee Bucks' },
  { code: 'MIN', name: 'Minnesota Timberwolves' },
  { code: 'NOP', name: 'New Orleans Pelicans' },
  { code: 'NYK', name: 'New York Knicks' },
  { code: 'OKC', name: 'Oklahoma City Thunder' },
  { code: 'ORL', name: 'Orlando Magic' },
  { code: 'PHI', name: 'Philadelphia 76ers' },
  { code: 'PHO', name: 'Phoenix Suns' },
  { code: 'POR', name: 'Portland Trail Blazers' },
  { code: 'SAC', name: 'Sacramento Kings' },
  { code: 'SAS', name: 'San Antonio Spurs' },
  { code: 'SEA', name: 'Seattle SuperSonics' },
  { code: 'TOR', name: 'Toronto Raptors' },
  { code: 'UTA', name: 'Utah Jazz' },
  { code: 'WAS', name: 'Washington Wizards' }
];

const DECADES = [
  { label: '1980s', val: 1980 },
  { label: '1990s', val: 1990 },
  { label: '2000s', val: 2000 },
  { label: '2010s', val: 2010 },
  { label: '2020s', val: 2020 }
];

const AWARDS = [
  { type: 'All-Star', name: 'All-Star' },
  { type: 'All-NBA', name: 'All-NBA' },
  { type: 'All-Defense', name: 'All-Defense' }
];

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const topPicksCache = new Map<string, any[]>();

export default function App() {
  const [data, setData] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          let next = prev + (Math.random() * 8) + 4; // Go up by 4-12% each tick
          if (!dataLoaded && next >= 90) {
            return 90;
          }
          if (dataLoaded && next >= 100) {
             clearInterval(interval);
             setTimeout(() => setLoading(false), 200);
             return 100;
          }
          return next;
        });
      }, 120);
    }
    return () => clearInterval(interval);
  }, [loading, dataLoaded]);

  const [showWelcome, setShowWelcome] = useState(true);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'choose' | 'unified'>('choose');
  const [gmName, setGmName] = useState(() => localStorage.getItem('8mpr_gmName') || '');

  useEffect(() => {
    if (gmName) {
      localStorage.setItem('8mpr_gmName', gmName);
    } else {
      localStorage.removeItem('8mpr_gmName');
    }
  }, [gmName]);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [leaderboardData, setLeaderboardData] = useState<GMStats[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const [excludeInputValues, setExcludeInputValues] = useState<string[]>(Array(8).fill(''));
  const [excludeInputActive, setExcludeInputActive] = useState<boolean[]>(Array(8).fill(false));

  const handleAuthSubmit = async () => {
    setAuthError(null);
    
    if (!loginInput.trim() || !password.trim()) {
      setAuthError("Please enter both a GM Handle and Password.");
      return;
    }

    // 1. League Office Profanity Check
    const rawInput = loginInput.trim();
    
    // Normalization Pass: Map leetspeak & special characters to standard letters
    const leetspeakMapped = rawInput
      .toLowerCase()
      .replace(/[@4]/g, 'a')
      .replace(/[1!|]/g, 'i')
      .replace(/3/g, 'e')
      .replace(/0/g, 'o')
      .replace(/[$5]/g, 's')
      .replace(/7/g, 't')
      .replace(/8/g, 'b')
      .replace(/[\^\*]/g, 'u');

    // Space Preservation: Strip non-alphanumeric characters but preserve spaces
    const spacedNormalized = leetspeakMapped.replace(/[^a-z0-9\s]/g, '');

    // Pass 1: Remove all spaces and check against a severeSubstrings array
    const normalizedNoSpaces = spacedNormalized.replace(/\s+/g, '');
    const severeSubstrings = [
      'fuck', 'fuk', 'fck', 'fvk', 'cunt', 'nigger', 'nigga', 'rape', 'rapist', 
      'pedof', 'pedoph', 'bitch', 'whore', 'slut', 'pussy', 'cock', 
      'dick', 'kike', 'chink', 'faggot', 'fag', 'retard'
    ];
    const hasSevereObscenity = severeSubstrings.some(term => normalizedNoSpaces.includes(term));

    // Pass 2: Word-bounded terms for words that have benign overlaps (e.g. "ass" in "Cassidy")
    const boundedRegex = /\b(4r5e|5h1t|5hit|a55|anal|anus|ar5e|arrse|arse|ass|asses|asshole|assholes|bastard|blowjob|boner|butt|butthole|cum|dlck|dildo|jizz|piss|poop|porn|prick|shit|shite|shitting|shitty|tit|tits|titties|twat|vagina|wank|wanker)\b/gi;
    
    if (hasSevereObscenity || boundedRegex.test(spacedNormalized)) {
      setAuthError("The League Office has rejected this GM Name for inappropriate conduct.");
      return;
    }

    const cleanGmName = rawInput.replace(/\s+/g, '').toLowerCase();
    const syntheticEmail = `${cleanGmName}@8mprhoops.net`;

    // 2. Supabase Unified Auth (Attempt Login -> Fallback to Register)
    if (isSupabaseConfigured) {
      try {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            // Attempt Sign Up
            const signUpResponse = await supabase.auth.signUp({
              email: syntheticEmail,
              password: password,
              options: {
                data: {
                  gm_name: rawInput
                }
              }
            });

            if (signUpResponse.error) {
              if (signUpResponse.error.message.includes('User already registered') || signUpResponse.error.message.includes('already exists')) {
                 setAuthError("Incorrect password for this GM Handle.");
                 return;
              } else {
                 setAuthError(signUpResponse.error.message);
                 return;
              }
            }
            // Sign up successful
          } else {
            setAuthError(error.message);
            return;
          }
        }
        
        // Success
        setGmName(rawInput);
      } catch (err: any) {
        setAuthError(err.message || "Authentication failed.");
      }
    } else {
      // Fallback for local testing
      console.log(`[LOCAL] Executing Unified Auth for: ${syntheticEmail}`);
      setGmName(rawInput);
    }
  };

  const [isTeamBuilder, setIsTeamBuilder] = useState(false);
  const [teamBuilderSlots, setTeamBuilderSlots] = useState<Slot[]>([]);
  const [teamBuilderDecade, setTeamBuilderDecade] = useState<string>('All-Time');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isLoadingCreateMode, setIsLoadingCreateMode] = useState(false);
  const [createModeProgress, setCreateModeProgress] = useState(0);
  const [customDraftSlots, setCustomDraftSlots] = useState<CustomSlotConfig[]>(
    Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] })
  );
  const [showModeSwitchConfirm, setShowModeSwitchConfirm] = useState(false);
  const [isCustomDraft, setIsCustomDraft] = useState(false);
  const [pendingModeDecade, setPendingModeDecade] = useState<string | undefined>(undefined);

  const handleModeSwitchClick = (overrideDecade?: string | React.MouseEvent) => {
    // If we are in Create Mode, there is no "progress" to lose since customDraftSlots don't hold players in the same way,
    // or maybe we just want to let them switch freely.
    let hasProgress = false;
    if (!isCreateMode) {
      const currentSlots = isTeamBuilder ? teamBuilderSlots : slots;
      hasProgress = currentSlots.some(s => s.player !== null);
    }
    
    if (hasProgress) {
      if (typeof overrideDecade === 'string') {
        setPendingModeDecade(overrideDecade);
      } else {
        setPendingModeDecade(undefined);
      }
      setShowModeSwitchConfirm(true);
    } else {
      initTeamBuilder(overrideDecade);
    }
  };

  const initTeamBuilder = (overrideDecade?: string | React.MouseEvent) => {
    const isMouseEvent = overrideDecade && typeof overrideDecade !== 'string';
    const targetDecadeStr = (typeof overrideDecade === 'string') ? overrideDecade : teamBuilderDecade;
    const newMode = (typeof overrideDecade === 'string') ? true : !isTeamBuilder;
    
    if (isCustomDraft) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsCustomDraft(false);
    }
    
    setIsTeamBuilder(newMode);
    setIsCreateMode(false);
    if (typeof overrideDecade === 'string') {
      setTeamBuilderDecade(overrideDecade);
    }
    
    if (newMode) {
      const isAllTime = targetDecadeStr === 'All-Time';
      const suffix = isAllTime ? 'who played in the NBA.' : `who played in the ${targetDecadeStr}s.`;
      
      const getCriteria = (pos: string) => {
        return isAllTime ? { pos } : { pos, playedInDecade: parseInt(targetDecadeStr, 10) };
      };

      setTeamBuilderSlots([
        { id: 's1', type: 'G', label: 'Starter 1', question: `Name a Guard (PG/SG) ${suffix}`, filterCriteria: getCriteria('G'), player: null, isValid: null },
        { id: 's2', type: 'G', label: 'Starter 2', question: `Name a Guard (PG/SG) ${suffix}`, filterCriteria: getCriteria('G'), player: null, isValid: null },
        { id: 's3', type: 'W', label: 'Starter 3', question: `Name a Wing (SF/SG) ${suffix}`, filterCriteria: getCriteria('W'), player: null, isValid: null },
        { id: 's4', type: 'F/C', label: 'Starter 4', question: `Name a Forward (SF/PF) or Center ${suffix}`, filterCriteria: getCriteria('F/C'), player: null, isValid: null },
        { id: 's5', type: 'C', label: 'Starter 5', question: `Name a Big (C/PF) ${suffix}`, filterCriteria: getCriteria('C'), player: null, isValid: null },
        { id: 'b1', type: 'G', label: 'Bench 1', question: `Name a Guard (PG/SG) ${suffix}`, filterCriteria: getCriteria('G'), player: null, isValid: null },
        { id: 'b2', type: 'F', label: 'Bench 2', question: `Name a Forward (SF or PF) ${suffix}`, filterCriteria: getCriteria('F'), player: null, isValid: null },
        { id: 'b3', type: 'C', label: 'Bench 3', question: `Name a Big (C/PF) ${suffix}`, filterCriteria: getCriteria('C'), player: null, isValid: null }
      ]);
      setSlotPenalties(Array(8).fill(0));
      setActiveDraftIndex(0);
      setSearchQuery('');
      setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
      setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
    } else {
      setSlotPenalties(Array(8).fill(0));
      setActiveDraftIndex(0);
      setSearchQuery('');
      setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
      setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
      setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
    }
  };

  // Teammate overlap: returns the exact set of season-years a star actually played
  // on a given team. Used so "teammate of X" requires sharing a real season with X,
  // not merely being on the same franchise within a year-window. Cached per star+team.
  const teammateSeasonsCache = useRef<Map<string, Set<number>>>(new Map());
  const getStarSeasonYears = (starName: string, team: string): Set<number> => {
    const key = `${normalizeString(starName).toLowerCase()}|${team}`;
    const cached = teammateSeasonsCache.current.get(key);
    if (cached) return cached;
    const years = new Set<number>();
    const starLower = normalizeString(starName).toLowerCase();
    const star = data.find(p => normalizeString(p.name).toLowerCase() === starLower);
    if (star) {
      star.seasons.forEach(s => {
        const t = TEAM_ALIASES[s.team] || s.team;
        if (t === team) {
          const y = parseInt(s.season, 10);
          if (!isNaN(y)) years.add(y);
        }
      });
    }
    teammateSeasonsCache.current.set(key, years);
    return years;
  };

  // Is a named player a PURE CENTER (eligible only at C, never SF/PF)? Used to strip
  // now-pointless center exclusions from the forwards-only Bench 2 display text.
  const isPureCenterName = (name: string): boolean => {
    const lower = normalizeString(name).toLowerCase();
    const p = data.find(pl => normalizeString(pl.name).toLowerCase().includes(lower));
    if (!p || !p.eligiblePositions || p.eligiblePositions.length === 0) return false;
    return p.eligiblePositions.every(pos => pos === 'C');
  };

  const getTopPicksForSlot = (slot: Slot) => {
    const fc = slot.filterCriteria;
    if (!fc) return [];

    const cacheKey = `${slot.id}_${slot.question}`;
    if (topPicksCache.has(cacheKey)) return topPicksCache.get(cacheKey)!;

    let allowedPositions: string[] = [];
    if (slot.id && slot.id !== 'mock') {
      const slotIndex = ['s1', 's2', 's3', 's4', 's5', 'b1', 'b2', 'b3'].indexOf(slot.id);
      allowedPositions = getAllowedPositionsForSlot(slot, slotIndex);
    } else {
      allowedPositions = getAllowedPositionsForSlot(slot, -1);
    }

    const excludeLower = fc.exclude ? fc.exclude.map(e => normalizeString(e).toLowerCase()) : null;

    const eligiblePlayers: { name: string; season: string; team: string; mpr8: number }[] = [];
    data.forEach(player => {
      if (excludeLower && excludeLower.length > 0) {
          if (excludeLower.some(name => player.lowerName.includes(name))) return;
      }

      if (fc.award && fc.award !== 'All-Star') {
        const pAwards = awardsBank[getPlayerKey(player.name)]?.[fc.award] || [];
        if (pAwards.length === 0) return;
        const hasAward = pAwards.some(aw => {
          let pass = true;
          if (fc.awardDecade) {
            const endYear = seasonToAllStarYear(aw.season);
            if (endYear < Number(fc.awardDecade) || endYear >= Number(fc.awardDecade) + 10) pass = false;
          }
          if (fc.awardTeam && aw.team !== fc.awardTeam) pass = false;
          if (fc.awardSeason && normalizeSeason(aw.season) !== normalizeSeason(fc.awardSeason)) pass = false;
          return pass;
        });
        if (!hasAward) return;
      }

      const eligiblePositions = player.eligiblePositions;
      let playerLevelPosValid = true;
      if (fc.pos) {
        if (!isPositionMatch(fc.pos, eligiblePositions)) playerLevelPosValid = false;
      }

      if (fc.excludePos) {
        const excludedPositions = Array.isArray(fc.excludePos) ? fc.excludePos : [fc.excludePos];
        if (eligiblePositions.some(p => excludedPositions.includes(p))) playerLevelPosValid = false;
      }

      if (!playerLevelPosValid) return; // Skips this player entirely
      if (fc.minTeams !== undefined) {
        const validTeams = player.seasons
          .map(s => (s.team || '').toString().trim().toUpperCase())
          .filter(team => team && team !== 'TOT' && team !== 'N/A' && !/^\d+TM$/.test(team));
        const uniqueTeams = new Set(validTeams).size;
        if (uniqueTeams < fc.minTeams) return;
      }

      if (fc.minPick !== undefined) {
        const effectivePick = player.draftPick === null ? 999 : player.draftPick;
        if (effectivePick < fc.minPick) return;
      }
      if (fc.maxPick !== undefined && (player.draftPick === null || player.draftPick > fc.maxPick)) return;
      if (fc.draftYearDecade !== undefined) {
        const draftDecade = Math.floor((player.draftYear || 0) / 10) * 10;
        if (draftDecade !== fc.draftYearDecade) return;
      }
      if (fc.draftYear !== undefined && player.draftYear !== fc.draftYear) return;
      if (fc.excludePick !== undefined && player.draftPick === fc.excludePick) return;
      if (fc.pick !== undefined && player.draftPick !== fc.pick) return;
      if (fc.draftRound !== undefined && (player.draftRound === null || player.draftRound < fc.draftRound)) return;
      if (fc.excludeFirstName !== undefined) {
        const firstName = player.name.split(' ')[0];
        if (normalizeString(firstName).toLowerCase() === normalizeString(fc.excludeFirstName).toLowerCase()) return;
      }

      player.seasons.forEach(season => {
        if (allowedPositions.length > 0) {
          const seasonPosArr = season.pos ? season.pos.split('-').map(p => p.trim()) : [];
          if (!seasonPosArr.some(p => allowedPositions.includes(p))) return;
        }

        if (fc.pos) {
          const seasonPosArr = season.pos ? season.pos.split('-').map(p => p.trim()) : [];
          if (!isPositionMatch(fc.pos, seasonPosArr)) return; // 'return' inside forEach acts as 'continue'
        }
        const normalizedSeasonTeam = TEAM_ALIASES[season.team] || season.team;
        if (fc.team && normalizedSeasonTeam !== fc.team) return;
        if (fc.conf && TEAM_CONFERENCES[normalizedSeasonTeam] !== fc.conf) return;
        if (fc.playedInDecade !== undefined) {
           const decStr = String(fc.playedInDecade).substring(0, 3);
           if (!season.season.startsWith(decStr)) return;
        }

        if (fc.minAwards !== undefined && fc.award) {
          if (fc.award === 'All-Star') {
            if (player.allStarYears.length < fc.minAwards) return;
          } else {
            const pAwards = awardsBank[getPlayerKey(player.name)]?.[fc.award] || [];
            if (pAwards.length < fc.minAwards) return;
          }
        }
        if (fc.award === 'All-Star') {
          const asgYear = seasonToAllStarYear(formatSeasonDisplay(season.season));
          if (!player.allStarYears.includes(asgYear)) return;
          if (fc.awardSeason && normalizeSeason(formatSeasonDisplay(season.season)) !== normalizeSeason(fc.awardSeason)) return;
          if (fc.awardDecade && (asgYear < Number(fc.awardDecade) || asgYear >= Number(fc.awardDecade) + 10)) return;
        } else if (fc.award) {
          const pAwards = awardsBank[getPlayerKey(player.name)]?.[fc.award] || [];
          const selectedNormalized = normalizeSeason(formatSeasonDisplay(season.season));
          const hasAward = pAwards.some(aw => {
            let pass = true;
            if (fc.awardDecade) {
              const endYear = seasonToAllStarYear(aw.season);
              if (endYear < Number(fc.awardDecade) || endYear >= Number(fc.awardDecade) + 10) pass = false;
            }
            if (fc.awardTeam && aw.team !== fc.awardTeam) pass = false;
            if (fc.awardSeason && normalizeSeason(aw.season) !== normalizeSeason(fc.awardSeason)) pass = false;
            if (normalizeSeason(aw.season) !== selectedNormalized) pass = false;
            return pass;
          });
          if (!hasAward) return;
        }

        if (fc.minBlk !== undefined) {
           if (season.g === 0 || (season.blk / season.g) < fc.minBlk) return;
        }
        if (fc.minStl !== undefined) {
           if (season.g === 0 || (season.stl / season.g) < fc.minStl) return;
        }
        if (fc.minBlkOrStl !== undefined) {
           if (season.g === 0) return;
           const blkAvg = season.blk / season.g;
           const stlAvg = season.stl / season.g;
           if (blkAvg < fc.minBlkOrStl && stlAvg < fc.minBlkOrStl) return;
        }
        if (fc.minTrb !== undefined) {
           if (season.g === 0 || (season.trb / season.g) < fc.minTrb) return;
        }
        if (fc.minPts !== undefined) {
           if (season.g === 0 || (season.pts / season.g) < fc.minPts) return;
        }
        if (fc.maxPts !== undefined) {
           if (season.g === 0 || (season.pts / season.g) >= fc.maxPts) return;
        }
        if (fc.minAst !== undefined) {
           if (season.g === 0 || (season.ast / season.g) < fc.minAst) return;
        }
        if (fc.seasonYear !== undefined) {
           if (parseInt(season.season, 10) !== fc.seasonYear) return;
        }
        if (fc.teamDecade !== undefined) {
           const y = parseInt(season.season, 10);
           if (normalizedSeasonTeam !== fc.teamDecade.team || y < fc.teamDecade.minYear || y > fc.teamDecade.maxYear) return;
        }
        if (fc.teammateWith !== undefined) {
           const y = parseInt(season.season, 10);
           if (normalizedSeasonTeam !== fc.teammateWith.team || y < fc.teammateWith.minYear || y > fc.teammateWith.maxYear) return;
           if (normalizeString(player.name).toLowerCase() === normalizeString(fc.teammateWith.name).toLowerCase()) return;
           // Require a REAL shared season: this season-year must be one the star also played on this team.
           if (!getStarSeasonYears(fc.teammateWith.name, fc.teammateWith.team).has(y)) return;
        }

        eligiblePlayers.push({
          name: player.name,
          season: season.season,
          team: season.team,
          mpr8: season.mpr8
        });
      });
    });

    const bestSeasonsMap = new Map<string, typeof eligiblePlayers[0]>();
    eligiblePlayers.forEach(p => {
      const existing = bestSeasonsMap.get(p.name);
      if (!existing || p.mpr8 > existing.mpr8) {
        bestSeasonsMap.set(p.name, p);
      }
    });

    const result = Array.from(bestSeasonsMap.values())
      .sort((a, b) => b.mpr8 - a.mpr8)
      .slice(0, 50);
      
    topPicksCache.set(cacheKey, result);
    return result;
  };

  useEffect(() => {
  if (data.length === 0) return;

  const params = new URLSearchParams(window.location.search);
  const challengeParam = params.get('challenge');
  if (challengeParam) {
    try {
      const decoded = LZString.decompressFromEncodedURIComponent(challengeParam);
      if (decoded) {
        const configArr: CustomSlotConfig[] = JSON.parse(decoded);
        if (Array.isArray(configArr) && configArr.length > 0 && configArr.length <= 8) {
          const builtSlots: Slot[] = configArr.map((cfg, i) => {
             const fc = buildCustomFilterCriteria(cfg);
             let q = 'Name a ';
             let posStr = 'Player';
             if (cfg.pos === 'G') posStr = 'Guard (PG/SG)';
             else if (cfg.pos === 'F') posStr = 'Forward (SF/PF)';
             else if (cfg.pos === 'C') posStr = 'Center/Big (C/PF)';
             else if (cfg.pos === 'W') posStr = 'Wing (SF/SG)';
             q += posStr;

             const playerExcludes: string[] = [];
             const draftExcludes: string[] = [];
             if (cfg.exclude && cfg.exclude.length > 0) {
               cfg.exclude.forEach(ex => {
                 const lower = ex.toLowerCase();
                 if (EXCEPTION_QUALIFIERS.some(q => q.toLowerCase() === lower)) {
                   draftExcludes.push(ex);
                 } else {
                   playerExcludes.push(ex);
                 }
               });
             }

             if (draftExcludes.length > 0) {
               const formattedDrafts = draftExcludes.map(
                 d => DRAFT_PHRASING_MAP[d.toLowerCase()] || d
               );
               q += ` ${formattedDrafts.join(" or ")}`;
             }
             
             if (cfg.teamOrConf && cfg.teamOrConf !== '') {
               let tcStr = '';
               if (cfg.teamOrConf === 'EAST') tcStr = 'the Eastern Conference';
               else if (cfg.teamOrConf === 'WEST') tcStr = 'the Western Conference';
               else tcStr = 'the ' + (FRANCHISES.find(f => f.code === cfg.teamOrConf)?.name || cfg.teamOrConf);
               q += ` from ${tcStr}`;
             }

             if (cfg.statOrAward && cfg.statOrAward !== '') {
               const opt = STAT_AWARD_OPTIONS.find(o => o.val === cfg.statOrAward);
               if (opt) q += ` who ${opt.label}`;
               else q += ` who ${cfg.statOrAward}`;
             }

             if (cfg.draftYear && cfg.draftYear !== '') {
               q += ` selected in the ${cfg.draftYear} NBA Draft`;
             } else if (cfg.decade && cfg.decade !== '') {
               q += ` in the ${cfg.decade}s`;
             } else {
               q += ` in any decade`;
             }

             if (playerExcludes.length > 0) {
               if (playerExcludes.length === 1) {
                 q += ` not named ${playerExcludes[0]}`;
               } else {
                 q += ` not named ${playerExcludes.slice(0, -1).join(', ')} or ${playerExcludes[playerExcludes.length - 1]}`;
               }
             }
             q += '.';
             
             return {
               id: `c${i}`,
               type: (['G','F','C','W'].includes(cfg.pos) ? cfg.pos : 'ANY') as any,
               label: `Pick ${i+1}`,
               question: q,
               filterCriteria: fc,
               player: null,
               isValid: null
             };
          });
          setIsCustomDraft(true);
          setSlots(builtSlots);
          return; // Skip daily generation
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const poolG = questionBank.filter(q => q.type === 'G');
  const poolW = questionBank.filter(q => q.type === 'W');
  const poolF = questionBank.filter(q => q.type === 'F');
  const poolC = questionBank.filter(q => q.type === 'C');

  // Starter 1 Modern Pool (2000s, 2010s, 2020s)
  const modernPoolG = poolG.filter(q => {
    const dec = q.decadeLabel;
    return dec === '2000s' || dec === '2010s' || dec === '2020s';
  });

  // Tags for 7-day recency tracking (NOT bare decade or bare theme)
  const getRecencyTags = (item: any): string[] => {
    const tags: string[] = [`q_id:${item.id}`]; // Bans exact question for 7 days
    if (item.filterCriteria?.team) tags.push(`team:${item.filterCriteria.team}`);
    if (item.filterCriteria?.team && item.decadeLabel) {
      tags.push(`team_decade:${item.filterCriteria.team}_${item.decadeLabel}`);
    }
    if (item.filterCriteria?.teammateWith?.name) {
      tags.push(`teammate:${item.filterCriteria.teammateWith.name}`);
    }
    return tags;
  };

  const getDailyBoard = (dateStr: string, recentTagsSet: Set<string>, nonce: number) => {
    const seedInt = parseInt(dateStr.replace(/-/g, ''), 10) + nonce * 1337;
    const prng = mulberry32(seedInt);

    const usedQuestions = new Set<string>();
    const dayTeams = new Set<string>();
    const dayAwards = new Set<string>();
    const dayThemes = new Map<string, number>();
    const dayDecades = new Map<string, number>();

    // "Achievement" themes skew toward current stars (the best scorer/All-Star/top
    // pick usually IS a star). Two of these back-to-back makes a board feel star-heavy.
    // We track the PREVIOUS slot's theme to discourage achievement-after-achievement
    // on the strict pass, giving the board a "blitz / deep-cut pause" rhythm.
    const ACHIEVEMENT_THEMES = new Set(['stat', 'top_pick', 'steal', 'conf_award']);
    let prevSlotWasAchievement = false;

    const shuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const tryPickQuestion = (pool: any[], strictDiversity: boolean) => {
      const shuffled = shuffle(pool);
      for (const item of shuffled) {
        if (usedQuestions.has(item.id)) continue;

        const rawTeam = item.filterCriteria?.team || item.filterCriteria?.teammateWith?.team;
        let normalizedTeam: string | null = null;
        if (rawTeam) {
            normalizedTeam = TEAM_ALIASES[rawTeam] || rawTeam;
            if (dayTeams.has(normalizedTeam)) continue; // Strictly max 1 franchise per day
        }

        // HARD CAP: Never allow more than 1 award question per board
        const award = item.filterCriteria?.award;
        if (award && dayAwards.has(award)) continue; 

        // During the fallback pass, heavily favor questions that have a unique franchise team
        if (!strictDiversity && !normalizedTeam && item.theme === 'conf_award') continue;

        const recencyTags = getRecencyTags(item);
        if (recentTagsSet && recencyTags.some(t => recentTagsSet.has(t))) continue; // 7-day team/teammate memory ban

        const decade = item.decadeLabel || 'generic';
        const currentDecadeCount = dayDecades.get(decade) || 0;
        
        // Enforce exact distribution caps: 80s(1), 90s(1), 00s(2), 10s(2), 20s(2), All-Time(1)
        const maxForDecade = (decade === '1980s' || decade === '1990s' || decade === 'All-Time') ? 1 : 2;
        
        if (currentDecadeCount >= maxForDecade) continue; // Strict decade cap

        const theme = item.theme || 'generic';
        const currentThemeCount = dayThemes.get(theme) || 0;
        if (strictDiversity && currentThemeCount >= 1) continue; // Same-day theme diversity

        // Achievement-adjacency spacing (soft): on the strict pass, don't place an
        // achievement-themed question directly after another one. Falls through on the
        // relaxed pass so buildability is never blocked.
        if (strictDiversity && prevSlotWasAchievement && ACHIEVEMENT_THEMES.has(theme)) continue;

        usedQuestions.add(item.id);
        if (normalizedTeam) dayTeams.add(normalizedTeam);
        if (award) dayAwards.add(award);
        dayThemes.set(theme, currentThemeCount + 1);
        dayDecades.set(decade, currentDecadeCount + 1);

        return item;
      }
      return null;
    };

    const slotRequirements = [
      { pos: 'G', pool: modernPoolG.length > 0 ? modernPoolG : poolG }, // Starter 1: strictly modern
      { pos: 'G', pool: poolG },
      { pos: 'W', pool: poolW },
      { pos: 'F', pool: poolF },
      { pos: 'C', pool: poolC },
      { pos: 'G', pool: poolG },
      { pos: 'F', pool: poolF },
      { pos: 'C', pool: poolC },
    ];

    const selectedBoard: any[] = [];

    for (const req of slotRequirements) {
      let picked = tryPickQuestion(req.pool, true);
      if (!picked) {
        picked = tryPickQuestion(req.pool, false);
      }
      if (!picked) {
        const remaining = shuffle(req.pool).find(q => {
          if (usedQuestions.has(q.id)) return false;
          const rawTeam = q.filterCriteria?.team || q.filterCriteria?.teammateWith?.team;
          if (rawTeam) {
            const normalizedTeam = TEAM_ALIASES[rawTeam] || rawTeam;
            if (dayTeams.has(normalizedTeam)) return false;
          }
          return true;
        });
        
        picked = remaining || req.pool.find(q => !usedQuestions.has(q.id)) || req.pool[0];
        usedQuestions.add(picked.id);

        const rawTeam = picked.filterCriteria?.team || picked.filterCriteria?.teammateWith?.team;
        if (rawTeam) {
          const normalizedTeam = TEAM_ALIASES[rawTeam] || rawTeam;
          dayTeams.add(normalizedTeam);
        }
      }
      selectedBoard.push(picked);
      // Remember whether this slot was achievement-themed, for the next slot's spacing check.
      prevSlotWasAchievement = ACHIEVEMENT_THEMES.has(picked.theme || 'generic');
    }

    return {
      selectedBoard,
      dayTags: Array.from(usedQuestions).flatMap(id => {
        const item = questionBank.find(q => q.id === id);
        return item ? getRecencyTags(item) : [];
      })
    };
  };

  // --- Answer-level spacing (nostalgia variety mechanic) ---
  // Beyond the 7-day question/team/teammate recency, we also discourage the same
  // OPTIMAL answer (best-scoring player) from recurring within a short window, so
  // the daily "aha" answer stays fresh (no "Dwight Howard 4 days running").
  // This uses a SEPARATE, shorter rolling window than the question-recency ban.
  const ANSWER_RECENCY_DAYS = 4; // fall back to 3 if this over-constrains buildability

  // Apply the same slot transforms the board uses, then return each slot's optimal
  // answer name. Mirrors the dailySlots mapping so the tracked answer matches what
  // the player actually sees as the best answer.
  const getBoardTopAnswers = (selectedBoard: any[]): string[] => {
    const names: string[] = [];
    selectedBoard.forEach((pick, i) => {
      const finalFc = pick.filterCriteria ? { ...pick.filterCriteria } : undefined;
      if (i === 3 && finalFc) finalFc.pos = 'F/C';
      // Bench 2 is a forwards-only slot ("Forward (SF or PF)"); force pos 'F' so the
      // filter matches the wording and pure centers (e.g. Dikembe) are not accepted.
      if (i === 6 && finalFc) finalFc.pos = 'F';
      if (!isCustomDraft && i === 1 && finalFc && !finalFc.pos) finalFc.excludePos = 'PF';
      const mockSlot = {
        ...pick,
        type: i === 3 ? 'F/C' : pick.type,
        filterCriteria: finalFc,
        id: ['s1','s2','s3','s4','s5','b1','b2','b3'][i],
      };
      const tp = getTopPicksForSlot(mockSlot as any);
      if (tp.length > 0) names.push(tp[0].name);
    });
    return names;
  };

  // Simulate past 14 days to track recently featured teams and teammates
  const recentTags = new Set<string>();
  const historyArray: string[][] = [];
  // Parallel rolling window of recent OPTIMAL answers (shorter than recentTags)
  const recentAnswers = new Set<string>();
  const answerHistoryArray: string[][] = [];
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let simDate = new Date(localToday.getTime() - 14 * 24 * 60 * 60 * 1000);

  while (simDate < localToday) {
    const simStr = simDate.toLocaleDateString('en-CA');
    const { dayTags, selectedBoard: pastBoard } = getDailyBoard(simStr, recentTags, 0);

    dayTags.forEach(t => recentTags.add(t));
    historyArray.push(dayTags);

    if (historyArray.length > 7) {
      historyArray.shift();
    }
    // Clear and rebuild the set from the remaining active days
    recentTags.clear();
    historyArray.flat().forEach(t => recentTags.add(t));

    // Track that day's optimal answers over a shorter (ANSWER_RECENCY_DAYS) window
    const pastAnswers = getBoardTopAnswers(pastBoard);
    answerHistoryArray.push(pastAnswers);
    if (answerHistoryArray.length > ANSWER_RECENCY_DAYS) {
      answerHistoryArray.shift();
    }
    recentAnswers.clear();
    answerHistoryArray.flat().forEach(a => recentAnswers.add(a));

    simDate.setDate(simDate.getDate() + 1);
  }

  // Generate today's board with score verification
  const todayString = localToday.toLocaleDateString('en-CA');
  const slotLabels = [
    { id: 's1', label: 'Starter 1' },
    { id: 's2', label: 'Starter 2' },
    { id: 's3', label: 'Starter 3' },
    { id: 's4', label: 'Starter 4' },
    { id: 's5', label: 'Starter 5' },
    { id: 'b1', label: 'Bench 1' },
    { id: 'b2', label: 'Bench 2' },
    { id: 'b3', label: 'Bench 3' }
  ];

  let bestBoardSlots: Slot[] | null = null;   // ideal: valid, in-window, answer-clean
  let inWindowFallback: Slot[] | null = null; // valid + in-window but repeats a recent answer
  let anyValidFallback: Slot[] | null = null; // valid but out of window
  let attemptNonce = 0;
  let maxAttempts = 200;

  while (attemptNonce < maxAttempts) {
    const { selectedBoard } = getDailyBoard(todayString, recentTags, attemptNonce);

    const dailySlots: Slot[] = selectedBoard.map((pick, i) => {
      let finalQuestion = pick.question;

      if (i === 3) {
        // Cleanly catch the updated database strings and apply the new formatting
        if (finalQuestion.includes('Big (PF/C) or Forward (PF/SF)')) {
          finalQuestion = finalQuestion.replace(/Big \(PF\/C\) or Forward \(PF\/SF\)/g, 'Forward (SF/PF) or Center');
        } 
        // Fallback for standard "Forward" questions
        else if (finalQuestion.includes('Forward') && !finalQuestion.includes('Forward (SF/PF) or Center')) {
          finalQuestion = finalQuestion.replace(/Forward/g, 'Forward (SF/PF) or Center');
        }
      }
      if (i === 6) {
        // Cleanly simplify any variant of the Forward/Big prompt for Bench 2
        finalQuestion = finalQuestion
          .replace(/Big \(PF\/C\) or Big Wing \(PF\/SF\)/g, 'Forward (SF or PF)')
          .replace(/Big \(PF\/C\) or Forward \(PF\/SF\)/g, 'Forward (SF or PF)');

        // Fallback for any standard "Forward" prompt without parentheticals
        if (!finalQuestion.includes('Forward (SF or PF)')) {
          finalQuestion = finalQuestion.replace(/Forward/g, 'Forward (SF or PF)');
        }

        // Bench 2 is forwards-only, so any "not named <pure center>" exclusion is now
        // pointless (that center can't be answered here anyway) and reads as nonsense
        // (e.g. "Forward ... not named Nikola Jokic"). Strip pure-center names from the
        // visible exclusion clause; drop the clause entirely if none remain.
        const excl = pick.filterCriteria?.exclude as string[] | undefined;
        if (excl && excl.length > 0) {
          const keptNames = excl.filter(n => !isPureCenterName(n));
          const removedAny = keptNames.length !== excl.length;
          if (removedAny) {
            // rebuild the "not named ..." clause from the kept names (or remove it)
            let clause = '';
            if (keptNames.length === 1) clause = ` not named ${keptNames[0]}`;
            else if (keptNames.length === 2) clause = ` not named ${keptNames[0]} or ${keptNames[1]}`;
            else if (keptNames.length >= 3) clause = ` not named ${keptNames.slice(0, -1).join(', ')}, or ${keptNames[keptNames.length - 1]}`;
            finalQuestion = finalQuestion.replace(/\s*not named .*?(?=\.?$)/i, '').replace(/\.?$/, '');
            finalQuestion = finalQuestion + clause + '.';
          }
        }
      }
      if ((i === 4 || i === 7) && finalQuestion.includes('Center')) {
        // Normalize a standalone "Center" to "Big (C/PF)" for the center slots,
        // but do NOT touch it if it is already part of a "Center/Big (C/PF)" or
        // "(C/PF)" phrase (which would create doubled "Big (C/PF)/Big (C/PF)").
        finalQuestion = finalQuestion.replace(/Center(?!\/Big|\s*\(C\/PF\))/g, 'Big (C/PF)');
      }

      const finalFc = pick.filterCriteria ? { ...pick.filterCriteria } : undefined;
      
      if (i === 3 && finalFc) {
        finalFc.pos = 'F/C';
      }

      // Bench 2 (slot 6) shows "Forward (SF or PF)" -> force forwards-only filter so it
      // matches the wording; prevents pure centers (e.g. Dikembe Mutombo) being accepted.
      if (i === 6 && finalFc) {
        finalFc.pos = 'F';
      }

      if (!isCustomDraft && i === 1 && finalFc && !finalFc.pos) {
        finalFc.excludePos = 'PF';
      }

      return {
        ...pick,
        type: i === 3 ? 'F/C' : pick.type,
        filterCriteria: finalFc,
        question: finalQuestion,
        id: slotLabels[i].id,
        label: slotLabels[i].label,
        player: null,
        isValid: null
      };
    });

    let maxPotentialScore = 0;
    let isValidBoard = true;
    let legendSlotCount = 0;
    let repeatsRecentAnswer = false;

    for (const slot of dailySlots) {
      const topPicks = getTopPicksForSlot(slot);
      if (topPicks.length < 10) {
        isValidBoard = false;
        break;
      }
      maxPotentialScore += topPicks[0].mpr8;
      // Count slots whose optimal (best-scoring) answer is a Top-100 legend
      if (LEGEND_NAMES.has(topPicks[0].name)) {
        legendSlotCount++;
      }
      // Answer-spacing: flag if this slot's optimal answer was optimal in the last few days
      if (recentAnswers.has(topPicks[0].name)) {
        repeatsRecentAnswer = true;
      }
    }

    // Reject boards that exceed the legend cap (too many superstar-optimal slots)
    if (isValidBoard && legendSlotCount > MAX_LEGENDS_PER_BOARD) {
      isValidBoard = false;
    }

    const inWindow = isValidBoard && maxPotentialScore >= 250 && maxPotentialScore <= 285;

    // Ideal board: valid, in-window, AND no optimal answer repeated from the last
    // ANSWER_RECENCY_DAYS days. Take it immediately.
    if (inWindow && !repeatsRecentAnswer) {
      bestBoardSlots = dailySlots;
      break;
    }

    // Soft fallbacks (answer-spacing is a preference, not a hard gate, so we never
    // get stuck): remember the best in-window board and any valid board, then keep
    // trying for an answer-clean one until attempts run out.
    if (inWindow && !inWindowFallback) {
      inWindowFallback = dailySlots;
    } else if (isValidBoard && !anyValidFallback) {
      anyValidFallback = dailySlots;
    }

    attemptNonce++;
  }

  // Priority: answer-clean in-window (bestBoardSlots) > in-window w/ repeat > any valid.
  if (!bestBoardSlots) {
    bestBoardSlots = inWindowFallback || anyValidFallback;
  }

  if (bestBoardSlots) {
    setSlots(bestBoardSlots);
  }

}, [data]);

  const [slotPenalties, setSlotPenalties] = useState<number[]>(Array(8).fill(0));
  const [activeDraftIndex, setActiveDraftIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flashingSlot, setFlashingSlot] = useState<number | null>(null);
  const [uiError, setUiError] = useState<{title: string, subtitle?: string} | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackImage, setFeedbackImage] = useState<File | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasLoggedGame, setHasLoggedGame] = useState(false);
  const [expandedTopPicksIndex, setExpandedTopPicksIndex] = useState<number | null>(null);

  useEffect(() => {
    if (showAuthModal && gmName) {
      const fetchLeaderboard = async () => {
        setIsLoadingLeaderboard(true);
        setLoadProgress(0);
        
        // Start a fake progress bar
        const progressInterval = setInterval(() => {
          setLoadProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 15) + 5;
          });
        }, 100);

        try {
          // Synthetic delay for satisfying UX loading bar
          await new Promise(resolve => setTimeout(resolve, 800));
          const data = await fetchGames();
          
          if (!data) return;

          const gmGroups: Record<string, { totalScore: number, gamesPlayed: number, totalSkips: number, dynastyCount: number }> = {};
          
          data.forEach(row => {
            const name = row.gm_name;
            if (!name || name === 'Guest') return;
            
            if (!gmGroups[name]) {
              gmGroups[name] = { totalScore: 0, gamesPlayed: 0, totalSkips: 0, dynastyCount: 0 };
            }
            gmGroups[name].totalScore += (row.score || 0);
            gmGroups[name].gamesPlayed += 1;
            gmGroups[name].totalSkips += (row.skips_used || 0);
            if (row.rank_tier === 'Dynasty Architect') {
              gmGroups[name].dynastyCount += 1;
            }
          });
          
          const aggregated: GMStats[] = Object.keys(gmGroups).map(name => {
            const stats = gmGroups[name];
            return {
              gmName: name,
              gamesPlayed: stats.gamesPlayed,
              averageScore: Number((stats.totalScore / stats.gamesPlayed).toFixed(1)),
              totalSkips: stats.totalSkips,
              dynastyCount: stats.dynastyCount,
              globalRank: 0
            };
          });
          
          aggregated.sort((a, b) => b.averageScore - a.averageScore);
          
          // Assign ranks
          aggregated.forEach((gm, idx) => {
            gm.globalRank = idx + 1;
          });
          
          setLeaderboardData(aggregated);
        } catch (err) {
          console.error("Error fetching leaderboard:", err);
        } finally {
          clearInterval(progressInterval);
          setLoadProgress(100);
          setTimeout(() => {
            setIsLoadingLeaderboard(false);
          }, 400); // Wait a moment so they see 100%
        }
      };
      fetchLeaderboard();
    }
  }, [showAuthModal, gmName]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getRank = (score: number) => {
    if (score >= 250) return { title: 'Dynasty Architect', icon: <Crown className="w-16 h-16 text-yellow-400" />, id: 'dynasty' };
    if (score >= 150) return { title: 'Playoff Contender', icon: <Trophy className="w-16 h-16 text-blue-400" />, id: 'playoff' };
    if (score >= 100) return { title: 'Play-In Team', icon: <Ticket className="w-16 h-16 text-white" />, id: 'playin' };
    return { title: 'Lottery Team', icon: <TrendingDown className="w-16 h-16 text-red-500" />, id: 'lottery' };
  };

  const shareResults = () => {
    // 1. New Team Builder Sharing Logic
    if (isTeamBuilder) {
      const teamType = teamBuilderDecade === 'All-Time' ? 'All-Time' : `${teamBuilderDecade}s`;
      let headerText = `🏀 8MPR Hoops | Ultimate ${teamType} Team Built\n🏆 Score: ${totalScore.toFixed(1)}\n\n`;
      
      let playerList = "";
      teamBuilderSlots.forEach((slot) => {
          const playerName = slot.player && slot.player.id !== 'skipped' ? slot.player.name : "SKIPPED";
          const score = slot.player && slot.player.id !== 'skipped' ? slot.player.mpr8.toFixed(1) : "N/A";
          playerList += `${slot.label}: ${playerName} (${score})\n`;
      });

      const text = headerText + playerList.trim();
      
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error("Failed to copy", err));
      
      return; // Exit early to prevent Daily Trivia logic from running
    }

    // 2. Original Daily Trivia Logic (Unchanged)
    const rankTitle = getRank(totalScore).title;
    
    const numRounds = slots.length;
    const rounds = Array(numRounds).fill(null).map((_, i) => {
        const slot = slots[i];
        if (!slot) return "⬛ N/A";
        
        let square = "🟩";
        if (slot.player?.id === 'skipped' || slot.player?.name === 'SKIPPED') {
            square = "⬛";
            return `${square} N/A`;
        } else {
            if (slotPenalties[i] < 0) {
                square = "🟥";
            }
            let grade = "N/A";
            if (slot.player && slot.isValid !== false) {
                grade = getPickGrade(slot.player.mpr8 - slotPenalties[i], getTopPicksForSlot(slot));
            }
            return `${square} ${grade}`;
        }
    });

    let resultText = "";
    if (numRounds === 8) {
        for (let i = 0; i < 4; i++) {
            const rLeft = i;
            const rRight = i + 4;
            
            const leftParts = rounds[rLeft].split(' ');
            const rightParts = rounds[rRight].split(' ');
            
            const leftSquare = leftParts[0];
            const leftGrade = leftParts[1] || 'N/A';
            
            const rightSquare = rightParts[0];
            const rightGrade = rightParts[1] || 'N/A';

            const leftStr = `R${rLeft + 1}: ${leftSquare} ${leftGrade.padEnd(4, ' ')}`;
            const rightStr = `R${rRight + 1}: ${rightSquare} ${rightGrade}`;
            
            resultText += `${leftStr}|  ${rightStr}\n`;
        }
    } else {
        for (let i = 0; i < numRounds; i++) {
            const parts = rounds[i].split(' ');
            const square = parts[0];
            const grade = parts[1] || 'N/A';
            resultText += `R${i + 1}: ${square} ${grade}\n`;
        }
    }

    const headerLabel = isCustomDraft ? `Custom Draft Challenge` : new Date().toLocaleDateString('en-CA');
    const text = `🏀 8MPR Hoops | ${headerLabel}\n🏆 Score: ${totalScore.toFixed(1)} | 👑 Rank: ${rankTitle}\n\n${resultText.trim()}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => console.error("Failed to copy", err));
  };

  const handleRestart = () => {
    setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
    setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
    setSlotPenalties(Array(8).fill(0));
    setActiveDraftIndex(0);
    setSearchQuery('');
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const lastTrashTalkRef = useRef<string | null>(null);

  useEffect(() => {
    fetch('players.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((rawPlayers: any[]) => {
        const players: Player[] = rawPlayers.map(p => {
          const seasons = p[2].map((s: any) => ({
            season: s[0],
            team: s[1],
            pos: s[2],
            g: s[3],
            pts: s[4],
            trb: s[5],
            ast: s[6],
            stl: s[7],
            blk: s[8],
            mpr8: s[9]
          }));
          return {
            id: p[0],
            name: p[1],
            lowerName: normalizeString(p[1]).toLowerCase(),
            eligiblePositions: getEligiblePositions(seasons),
            seasons: seasons,
            draftYear: p[3] ?? null,
            draftRound: p[4] ?? null,
            draftPick: p[5] ?? null,
            allStarYears: p[6] ?? []
          };
        });
        setData(players);
        setDataLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load players:', err);
        setDataLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      const currentSlotsLength = (isTeamBuilder ? teamBuilderSlots : slots).length;
      if (activeDraftIndex === currentSlotsLength && currentSlotsLength > 0) {
        document.getElementById('endgame-modal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (activeDraftIndex > 0) {
        document.getElementById(`slot-${activeDraftIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [activeDraftIndex, slots.length, teamBuilderSlots.length, isTeamBuilder, loading]);

  // Clear any lingering UI errors when moving to a new slot
  useEffect(() => {
    setUiError(null);
  }, [activeDraftIndex]);

  const activeSlotType = (isTeamBuilder ? teamBuilderSlots : slots)[activeDraftIndex]?.type;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || data.length === 0) return [];
    
    const query = normalizeString(searchQuery).toLowerCase();
    const currentSlots = isTeamBuilder ? teamBuilderSlots : slots;
    const activeSlot = currentSlots[activeDraftIndex];
    const fc = activeSlot?.filterCriteria;
    const allowedPositions = getAllowedPositionsForSlot(activeSlot, activeDraftIndex);
    
    const isEligible = (player: Player) => {
      const eligiblePositions = player.eligiblePositions;
      
      if (fc && fc.pos) {
        if (!isPositionMatch(fc.pos, eligiblePositions)) return false;
      }
      
      if (allowedPositions.length === 0) return true;
      return eligiblePositions.some(pos => allowedPositions.includes(pos));
    };
    
    return data
      .filter(p => normalizeString(p.name).toLowerCase().includes(query) && isEligible(p))
      .slice(0, 50);
  }, [searchQuery, data, activeDraftIndex, isTeamBuilder, teamBuilderSlots, slots]);

  const handleSelectPlayer = (player: Player) => {
    if (isConfirming) return;
    
    const currentSlots = isTeamBuilder ? teamBuilderSlots : slots;
    const isDuplicate = currentSlots.some(s => s.player && s.player.playerId === player.id);
    if (isDuplicate) {
      setUiError({ title: "You cannot select the same player twice!" });
      setSearchQuery('');
      setTimeout(() => setUiError(null), 3000);
      return;
    }
    
    const slot = currentSlots[activeDraftIndex];
    if (!slot) return;
    
    const fc = slot.filterCriteria;
    const allowedPositions = getAllowedPositionsForSlot(slot, activeDraftIndex);

    let eligibleSeasons: SeasonData[] = [];
    if (fc) {
        let playerLevelValid = true;
        if (fc.minTeams !== undefined) {
            const validTeams = player.seasons
              .map(s => (s.team || '').toString().trim().toUpperCase())
              .filter(team => team && team !== 'TOT' && team !== 'N/A' && !/^\d+TM$/.test(team));
            const uniqueTeams = new Set(validTeams).size;
            if (uniqueTeams < fc.minTeams) playerLevelValid = false;
        }
        if (fc.excludePos) {
            const excludedPositions = Array.isArray(fc.excludePos) ? fc.excludePos : [fc.excludePos];
            const eligiblePositions = player.eligiblePositions;
            if (eligiblePositions.some(p => excludedPositions.includes(p))) playerLevelValid = false;
        }

        let passesPlayerFilters = playerLevelValid;
        if (passesPlayerFilters) {
            if (fc.exclude && fc.exclude.some(name => normalizeString(player.name).toLowerCase().includes(normalizeString(name).toLowerCase()))) passesPlayerFilters = false;
            if (fc.minPick !== undefined) {
               const effectivePick = player.draftPick === null ? 999 : player.draftPick;
               if (effectivePick < fc.minPick) passesPlayerFilters = false;
            }
            if (fc.maxPick !== undefined && (player.draftPick === null || player.draftPick > fc.maxPick)) passesPlayerFilters = false;
            if (fc.draftYearDecade !== undefined) {
               const draftDecade = Math.floor((player.draftYear || 0) / 10) * 10;
               if (draftDecade !== fc.draftYearDecade) passesPlayerFilters = false;
            }
            if (fc.draftYear !== undefined && player.draftYear !== fc.draftYear) passesPlayerFilters = false;
            if (fc.excludePick !== undefined && player.draftPick === fc.excludePick) passesPlayerFilters = false;
            if (fc.pick !== undefined && player.draftPick !== fc.pick) passesPlayerFilters = false;
            if (fc.draftRound !== undefined && (player.draftRound === null || player.draftRound < fc.draftRound)) passesPlayerFilters = false;
            if (fc.excludeFirstName !== undefined) {
               const firstName = player.name.split(' ')[0];
               if (normalizeString(firstName).toLowerCase() === normalizeString(fc.excludeFirstName).toLowerCase()) passesPlayerFilters = false;
            }
        }

        if (passesPlayerFilters) {
            player.seasons.forEach(seasonData => {
                let isValid = true;
                
                if (allowedPositions.length > 0) {
                    const seasonPos = seasonData.pos ? seasonData.pos.split('-') : [];
                    if (!seasonPos.some(p => allowedPositions.includes(p.trim()))) isValid = false;
                }

                if (fc.pos) {
                  const seasonPosArr = seasonData.pos ? seasonData.pos.split('-').map(p => p.trim()) : [];
                  if (!isPositionMatch(fc.pos, seasonPosArr)) isValid = false;
                }

                const selectedNormalized = normalizeSeason(formatSeasonDisplay(seasonData.season));

                if (fc.minAwards !== undefined && fc.award) {
                    if (fc.award === 'All-Star') {
                        if (player.allStarYears.length < fc.minAwards) isValid = false;
                    } else {
                        const pAwards = awardsBank[getPlayerKey(player.name)]?.[fc.award] || [];
                        if (pAwards.length < fc.minAwards) isValid = false;
                    }
                }
                if (fc.award === 'All-Star') {
                  const asgYear = seasonToAllStarYear(formatSeasonDisplay(seasonData.season));
                  if (!player.allStarYears.includes(asgYear)) isValid = false;
                  if (isValid && fc.awardSeason && selectedNormalized !== normalizeSeason(fc.awardSeason)) isValid = false;
                  if (isValid && fc.awardDecade && (asgYear < Number(fc.awardDecade) || asgYear >= Number(fc.awardDecade) + 10)) isValid = false;
                } else if (fc.award) {
                  const pAwards = awardsBank[getPlayerKey(player.name)]?.[fc.award] || [];
                  const hasAward = pAwards.some(aw => {
                    let pass = true;
                    if (fc.awardDecade) {
                      const endYear = seasonToAllStarYear(aw.season);
                      if (endYear < Number(fc.awardDecade) || endYear >= Number(fc.awardDecade) + 10) pass = false;
                    }
                    if (fc.awardTeam && aw.team !== fc.awardTeam) pass = false;
                    if (fc.awardSeason && normalizeSeason(aw.season) !== normalizeSeason(fc.awardSeason)) pass = false;
                    if (normalizeSeason(aw.season) !== selectedNormalized) pass = false;
                    return pass;
                  });
                  if (!hasAward) isValid = false;
                }
                
                const normalizedDataTeam = TEAM_ALIASES[seasonData.team] || seasonData.team;
                if (fc.team && normalizedDataTeam !== fc.team) isValid = false;
                if (fc.conf && TEAM_CONFERENCES[normalizedDataTeam] !== fc.conf) isValid = false;
                if (fc.playedInDecade !== undefined) {
                   const decStr = String(fc.playedInDecade).substring(0, 3);
                   if (!seasonData.season.startsWith(decStr)) isValid = false;
                }
                
                if (fc.minBlk !== undefined && (seasonData.g === 0 || (seasonData.blk / seasonData.g) < fc.minBlk)) isValid = false;
                if (fc.minStl !== undefined && (seasonData.g === 0 || (seasonData.stl / seasonData.g) < fc.minStl)) isValid = false;
                if (fc.minBlkOrStl !== undefined) {
                   if (seasonData.g === 0) isValid = false;
                   else {
                     const blkAvg = seasonData.blk / seasonData.g;
                     const stlAvg = seasonData.stl / seasonData.g;
                     if (blkAvg < fc.minBlkOrStl && stlAvg < fc.minBlkOrStl) isValid = false;
                   }
                }
                if (fc.minTrb !== undefined && (seasonData.g === 0 || (seasonData.trb / seasonData.g) < fc.minTrb)) isValid = false;
                if (fc.minPts !== undefined && (seasonData.g === 0 || (seasonData.pts / seasonData.g) < fc.minPts)) isValid = false;
                if (fc.maxPts !== undefined && (seasonData.g === 0 || (seasonData.pts / seasonData.g) >= fc.maxPts)) isValid = false;
                if (fc.minAst !== undefined && (seasonData.g === 0 || (seasonData.ast / seasonData.g) < fc.minAst)) isValid = false;
                if (fc.seasonYear !== undefined && parseInt(seasonData.season, 10) !== fc.seasonYear) isValid = false;
                if (fc.teamDecade !== undefined) {
                   const y = parseInt(seasonData.season, 10);
                   if (normalizedDataTeam !== fc.teamDecade.team || y < fc.teamDecade.minYear || y > fc.teamDecade.maxYear) isValid = false;
                }
                if (fc.teammateWith !== undefined) {
                   const y = parseInt(seasonData.season, 10);
                   if (normalizedDataTeam !== fc.teammateWith.team || y < fc.teammateWith.minYear || y > fc.teammateWith.maxYear) isValid = false;
                   if (normalizeString(player.name).toLowerCase() === normalizeString(fc.teammateWith.name).toLowerCase()) isValid = false;
                   // Require a REAL shared season with the star, not just same franchise in the window.
                   if (!getStarSeasonYears(fc.teammateWith.name, fc.teammateWith.team).has(y)) isValid = false;
                }

                if (isValid) {
                    eligibleSeasons.push(seasonData);
                }
            });
        }
    } else {
        if (allowedPositions.length > 0) {
            eligibleSeasons = player.seasons.filter(seasonData => {
                const seasonPos = seasonData.pos ? seasonData.pos.split('-') : [];
                return seasonPos.some(p => allowedPositions.includes(p.trim()));
            });
        } else {
            eligibleSeasons = [...player.seasons];
        }
    }

    if (eligibleSeasons.length === 0) {
        const newPenaltyCount = (Math.abs(slotPenalties[activeDraftIndex]) + 5) / 5;
        
        let errorTitle = "";
        if (newPenaltyCount === 3) {
            errorTitle = "Be sure to call your daddy for this question. And by daddy we mean ours: basketball reference";
        } else {
            const trashTalk = [
                "Airball -- Not even close!",
                "Wrong! Get that weak stuff out of here",
                "Brick -- Try again!",
                "Incorrect -- Go back to the drawing board"
            ];
            
            // Filter out the last message so it doesn't repeat
            const availableTalk = lastTrashTalkRef.current 
                ? trashTalk.filter(msg => msg !== lastTrashTalkRef.current) 
                : trashTalk;
                
            const selectedTalk = availableTalk[Math.floor(Math.random() * availableTalk.length)];
            
            lastTrashTalkRef.current = selectedTalk;
            errorTitle = selectedTalk;
        }
        
        setUiError({ title: errorTitle, subtitle: "player selected does not meet draft question criteria" });
        setSlotPenalties(current => {
            const newPenalties = [...current];
            newPenalties[activeDraftIndex] -= 5;
            return newPenalties;
        });
        setSearchQuery('');
        setTimeout(() => setUiError(null), 20000);
        return;
    }

    eligibleSeasons.sort((a, b) => b.mpr8 - a.mpr8);
    const bestSeason = eligibleSeasons[0];

    const newPlayer: SlotPlayer = {
      playerId: player.id,
      name: player.name,
      season: bestSeason.season,
      team: bestSeason.team,
      pos: bestSeason.pos,
      mpr8: bestSeason.mpr8 + slotPenalties[activeDraftIndex],
      eligiblePositions: player.eligiblePositions
    };
    
    const currentActiveIndex = activeDraftIndex;
    setFlashingSlot(currentActiveIndex);
    setIsConfirming(true);
    
    setTimeout(() => {
      if (isTeamBuilder) {
        setTeamBuilderSlots(current => 
          current.map((s, idx) => 
            idx === currentActiveIndex ? { ...s, player: newPlayer, isValid: true } : s
          )
        );
      } else {
        setSlots(current => 
          current.map((s, idx) => 
            idx === currentActiveIndex ? { ...s, player: newPlayer, isValid: true } : s
          )
        );
      }
      
      setIsSearching(false);
      setSearchQuery('');
      setFlashingSlot(null);
      setIsConfirming(false);
      
      setActiveDraftIndex(idx => idx + 1);
    }, 200);
  };

  const handleSkipSlotClick = () => {
    setShowSkipConfirm(true);
  };

  const executeSkipSlot = () => {
    const currentActiveIndex = activeDraftIndex;

    setSlotPenalties(current => {
      const newPenalties = [...current];
      newPenalties[currentActiveIndex] = -25;
      return newPenalties;
    });

    if (isTeamBuilder) {
      setTeamBuilderSlots(current => 
        current.map((s, index) => {
          if (index === currentActiveIndex) {
            return { 
              ...s, 
              player: {
                id: 'skipped',
                name: 'SKIPPED',
                season: '-',
                team: '-',
                pos: s.type === 'W' ? 'G/F' : s.type,
                g: 0,
                pts: 0,
                trb: 0,
                ast: 0,
                stl: 0,
                blk: 0,
                mpr8: -25
              } as unknown as SlotPlayer,
              isValid: false 
            };
          }
          return s;
        })
      );
    } else {
      setSlots(current => 
        current.map((s, index) => {
          if (index === currentActiveIndex) {
            return { 
              ...s, 
              player: {
                id: 'skipped',
                name: 'SKIPPED',
                season: '-',
                team: '-',
                pos: s.type === 'W' ? 'G/F' : s.type,
                g: 0,
                pts: 0,
                trb: 0,
                ast: 0,
                stl: 0,
                blk: 0,
                mpr8: -25
              } as unknown as SlotPlayer,
              isValid: false 
            };
          }
          return s;
        })
      );
    }
    setActiveDraftIndex(currentActiveIndex + 1);
    setUiError(null);
    setIsSearching(false);
    setSearchQuery('');
    setShowSkipConfirm(false);
  };


  const totalScore = isCreateMode ? 0 : (isTeamBuilder ? teamBuilderSlots : slots).reduce((sum, slot) => {
    if (!slot.player) return sum;
    return sum + slot.player.mpr8;
  }, 0);

  useEffect(() => {
    if (activeDraftIndex === 0) {
      setHasLoggedGame(false);
    } else {
      const currentSlotsLength = (isTeamBuilder ? teamBuilderSlots : slots).length;
      if (currentSlotsLength > 0 && activeDraftIndex === currentSlotsLength && !hasLoggedGame) {
        setHasLoggedGame(true);

        const is_custom_draft = isTeamBuilder || isCreateMode || isCustomDraft;
        const finalGmName = (!gmName || gmName.trim() === '') ? 'Guest' : gmName.trim();
        
        const currentSlots = isTeamBuilder ? teamBuilderSlots : slots;
        const skips_used = currentSlots.filter(s => s.player?.id === 'skipped').length;
        const rank_tier = getRank(totalScore).title;
        // The current local date formatted as 'YYYY-MM-DD'
        const play_date = new Date().toLocaleDateString('en-CA'); 

        saveGame({
          gm_name: finalGmName,
          play_date,
          score: totalScore,
          rank_tier,
          is_custom_draft,
          skips_used
        });
      }
    }
  }, [activeDraftIndex, hasLoggedGame, isTeamBuilder, teamBuilderSlots, slots, isCreateMode, isCustomDraft, gmName, totalScore]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-x-hidden font-sans court-bg">
      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="pt-8 pb-4 px-6 text-center flex flex-col items-center w-full">
          <div className="flex flex-col w-full max-w-4xl mx-auto">
            {/* Top Section: Daily Draft Banner (Moved to Scoreboard) */}

            {/* Scoreboard Section */}
            <div className="order-1 md:order-2 flex flex-col items-center w-full">
              {/* Middle Section: The Main Board Body */}
              <div className="retro-box-dual rounded-3xl p-4 md:p-6 lg:p-8 relative z-10 flex flex-col items-center w-full">
                <div className="flex flex-row items-center justify-center gap-2 md:gap-3 w-full">
                  <HoopIcon className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white drop-shadow-[2px_2px_0px_#dc2626] shrink-0" />
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-retro tracking-tight uppercase text-white drop-shadow-[2px_2px_0px_#dc2626] leading-normal sm:leading-none text-center">
                    8-Man Playoff Rotation
                  </h1>
                  <HoopIcon className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white drop-shadow-[2px_2px_0px_#dc2626] shrink-0" />
                </div>
                <p className="mt-3 text-slate-200 font-sans text-[10px] sm:text-xs md:text-sm lg:text-base text-center w-full uppercase tracking-[0.2em] font-black drop-shadow-[2px_2px_0px_#dc2626] leading-normal max-w-full px-2">
                  A PRO HOOPS QUIZ GAME IN A DRAFT FORMAT
                </p>
              </div>

              {/* Bottom Section: The Support Legs */}
              <div className="flex justify-between w-64 md:w-80 relative -mt-1 z-0">
                <div className="flex flex-col items-center">
                   <div className="w-6 md:w-8 h-8 bg-[#0f172a] border-x-4 border-slate-700"></div>
                   <div className="w-10 md:w-14 h-3 bg-slate-700 rounded-t-md"></div>
                </div>
                <div className="flex flex-col items-center">
                   <div className="w-6 md:w-8 h-8 bg-[#0f172a] border-x-4 border-slate-700"></div>
                   <div className="w-10 md:w-14 h-3 bg-slate-700 rounded-t-md"></div>
                </div>
              </div>
              
              {/* Combined Dashboard Board */}
              <div className="retro-box-dual p-5 sm:p-7 flex flex-col items-center rounded-2xl shrink-0 w-[320px] sm:w-[420px] gap-6 relative mt-6 z-10">
                {/* Top Row: Playbook, Logo, Front Office */}
                <div className="flex items-start justify-between w-full">
                  <button 
                    onClick={() => setShowPlaybook(true)}
                    className="group flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-all duration-200 ease-in-out active:translate-y-[2px] w-[80px] sm:w-[90px] shrink-0 pt-1"
                  >
                    <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all" />
                    <span className="text-xs sm:text-sm text-white uppercase tracking-widest font-retro drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all text-center leading-tight whitespace-pre-wrap">8MPR<br/>Playbook</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsCreateMode(false);
                      setIsTeamBuilder(false);
                      if (isCustomDraft) {
                        window.location.href = window.location.pathname;
                      }
                      setSlotPenalties(Array(8).fill(0));
                      setActiveDraftIndex(0);
                      setSearchQuery('');
                      setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                      setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                      setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                      setShowWelcome(false);
                      window.scrollTo(0, 0);
                    }}
                    className="group flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full hover:brightness-125 active:brightness-150 transition-all duration-200 cursor-pointer focus:outline-none"
                  >
                    <div className="flex flex-col items-center w-full group-active:scale-95 group-active:translate-y-[2px] transition-transform duration-200">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 relative flex items-center justify-center">
                        <img src={logoImg} alt="8MPR Hoops Logo" className="w-20 h-20 object-contain" />
                      </div>
                      <span className="text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest font-sans text-center whitespace-nowrap">
                         {isCustomDraft ? 'Custom Draft' : 'Daily Trivia'}
                      </span>
                      <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest font-sans text-center mt-1">
                         {isCustomDraft ? '' : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="group flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-all duration-200 ease-in-out active:translate-y-[2px] w-[80px] sm:w-[90px] shrink-0 pt-1"
                  >
                    <TableOfContents className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all" />
                    <span className="text-xs sm:text-sm text-white uppercase tracking-widest font-retro drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all text-center leading-tight whitespace-pre-wrap">Front<br/>Office</span>
                  </button>
                </div>

                {/* Bottom Row: Team Builder, Score, Create Draft */}
                <div className="flex items-end justify-between w-full mt-2">
                  {/* Team Builder (Square-ish) */}
                  <div className="w-[80px] sm:w-[90px] flex flex-col items-center justify-end">
                    <button 
                      onClick={(e) => {
                        if (isTeamBuilder) return; // Already in Team Builder mode
                        handleModeSwitchClick(e);
                      }}
                      className="group flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-all duration-200 ease-in-out active:translate-y-[2px] w-[80px] sm:w-[90px] shrink-0 pt-1 focus:outline-none"
                    >
                      <TeamworkIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all" />
                      <span className="text-xs sm:text-sm text-white uppercase tracking-widest font-retro drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all text-center leading-tight whitespace-pre-wrap">
                        Team<br/>Builder
                      </span>
                    </button>
                  </div>

                  {/* Center Logo & Text */}
                  <div className="flex flex-col items-center justify-end border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full pb-1">
                    <span className="text-slate-400 text-[11px] sm:text-xs uppercase tracking-widest leading-[1.1] font-bold text-center mb-1">GM<br/>Score</span>
                    <span className="text-4xl sm:text-5xl font-retro text-white leading-none mt-2 drop-shadow-[2px_2px_0px_#dc2626] truncate w-full text-center">{totalScore.toFixed(1)}</span>
                  </div>

                  {/* Create Draft (Square-ish) */}
                  <div className="w-[80px] sm:w-[90px] flex flex-col items-center justify-end">
                    <button 
                      onClick={() => {
                        if (isCreateMode) return; // Already in Create Mode
                        if (isCustomDraft) {
                          window.location.href = window.location.pathname;
                          return;
                        }
                        
                        setSlotPenalties(Array(8).fill(0));
                        setActiveDraftIndex(0);
                        setSearchQuery('');
                        setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                        setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                        setIsLoadingCreateMode(true);
                        setCreateModeProgress(0);
                        let prog = 0;
                        const interval = setInterval(() => {
                          prog += 20;
                          setCreateModeProgress(Math.min(100, prog));
                          if (prog >= 100) {
                            clearInterval(interval);
                            setIsCreateMode(true);
                            setIsTeamBuilder(false);
                            setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                            setIsLoadingCreateMode(false);
                          }
                        }, 50);
                      }}
                      className="group flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-all duration-200 ease-in-out active:translate-y-[2px] w-[80px] sm:w-[90px] shrink-0 pt-1 focus:outline-none"
                    >
                      <DraftsIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all" />
                      <span className="text-xs sm:text-sm text-white uppercase tracking-widest font-retro drop-shadow-[2px_2px_0px_#dc2626] group-hover:drop-shadow-[2px_2px_0px_#2563eb] transition-all text-center leading-tight whitespace-pre-wrap">
                        Create<br/>Draft
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {isLoadingCreateMode && !loading && (
              <div className="order-3 mt-4 flex flex-col items-center w-full max-w-md mx-auto">
                <div className="w-full mt-2 mb-1 px-1 shrink-0 relative z-20">
                  <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-retro tracking-widest mb-1 uppercase">
                    <span>LOADING MOCK DRAFT SYSTEM...</span>
                    <span>{Math.round(createModeProgress)}%</span>
                  </div>
                  <div className="w-full h-3 sm:h-4 bg-slate-800 border-2 border-slate-600 rounded-sm p-[1px]">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${Math.min(100, Math.max(0, createModeProgress))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mode Switch Confirm Modal */}
        <AnimatePresence>
          {showModeSwitchConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="retro-box-red rounded-2xl max-w-sm w-full p-6 text-center"
              >
                <div className="w-16 h-16 mx-auto bg-red-950 border-2 border-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-retro text-white mb-2 uppercase">Warning</h3>
                <p className="text-slate-300 font-sans font-bold uppercase mb-6 tracking-widest">
                  Switching modes clears selection progress.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      if (pendingModeDecade) {
                          setTeamBuilderDecade(pendingModeDecade);
                      }
                      initTeamBuilder(pendingModeDecade);
                      setShowModeSwitchConfirm(false);
                      setPendingModeDecade(undefined);
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-sans font-bold uppercase tracking-widest rounded-lg border-2 border-red-400 transition-colors"
                  >
                    Yes, switch modes
                  </button>
                  <button 
                    onClick={() => {
                      setShowModeSwitchConfirm(false);
                      setPendingModeDecade(undefined);
                    }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold uppercase tracking-widest rounded-lg border-2 border-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col gap-4 pb-20">
          
          {loading && (
            <div className="flex flex-col items-center pt-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-white uppercase tracking-widest font-sans font-bold">Loading Rosters...</p>
            </div>
          )}

          {!loading && !isLoadingCreateMode && isCreateMode && (
            <div className="flex flex-col gap-4">
              <div className="text-center mt-8 mb-6">
                <h2 className="inline-block text-2xl md:text-3xl font-retro text-white border-b-4 border-blue-600 pb-2 drop-shadow-[2px_2px_0px_#2563eb] tracking-widest">
                  CREATE YOUR DRAFT
                </h2>
              </div>
              <div className="retro-box-dual rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-slate-200 font-sans font-bold uppercase tracking-widest text-sm md:text-base">
                  Quick Fill: Historical Redraft
                </span>
                <div className="relative w-full sm:w-auto">
                  <select
                    className="w-full bg-slate-900 border-2 border-blue-600 text-blue-400 font-sans font-bold uppercase rounded-xl px-4 py-2 appearance-none outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all pr-10"
                    onChange={(e) => {
                      const year = e.target.value;
                      if (year !== '') {
                        const layout = ['G', 'G', 'W', 'F', 'C', 'G', 'F', 'C'];
                        const redraftSlots = layout.map(pos => ({
                          pos,
                          teamOrConf: '',
                          statOrAward: '',
                          decade: '',
                          draftYear: year,
                          exclude: []
                        }));
                        setCustomDraftSlots(redraftSlots);
                      } else {
                        setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Select Draft Year...</option>
                    {Array.from({ length: 2025 - 1980 + 1 }, (_, i) => 2025 - i).map(year => (
                      <option key={year} value={year}>{year} NBA Draft</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              {customDraftSlots.map((config, index) => {
                const fc = buildCustomFilterCriteria(config);
                const mockSlot = { id: `mock-${index}-${JSON.stringify(config)}`, type: 'ANY' as any, label: `Slot ${index + 1}`, question: '', filterCriteria: fc, player: null, isValid: null };
                const topPicks = getTopPicksForSlot(mockSlot);
                const count = topPicks.length;
                
                const hasCriteria = config.pos !== '' || config.teamOrConf !== '' || config.statOrAward !== '' || config.decade !== '' || (config.exclude && config.exclude.length > 0);

                const isRed = hasCriteria && count < 5;
                const isGreen = hasCriteria && count >= 5;
                
                let q = 'Name a ';
                let posStr = 'Player';
                if (config.pos === 'G') posStr = 'Guard (PG/SG)';
                else if (config.pos === 'F') posStr = 'Forward (SF/PF)';
                else if (config.pos === 'C') posStr = 'Center/Big (C/PF)';
                else if (config.pos === 'W') posStr = 'Wing (SF/SG)';
                q += posStr;
                
                const playerExcludes: string[] = [];
                const draftExcludes: string[] = [];
                if (config.exclude && config.exclude.length > 0) {
                  config.exclude.forEach(ex => {
                    const lower = ex.toLowerCase();
                    if (EXCEPTION_QUALIFIERS.some(qual => qual.toLowerCase() === lower)) {
                      draftExcludes.push(ex);
                    } else {
                      playerExcludes.push(ex);
                    }
                  });
                }

                if (draftExcludes.length > 0) {
                  const formattedDrafts = draftExcludes.map(
                    d => DRAFT_PHRASING_MAP[d.toLowerCase()] || d
                  );
                  q += ` ${formattedDrafts.join(" or ")}`;
                }

                if (config.teamOrConf && config.teamOrConf !== '') {
                  let tcStr = '';
                  if (config.teamOrConf === 'EAST') tcStr = 'the Eastern Conference';
                  else if (config.teamOrConf === 'WEST') tcStr = 'the Western Conference';
                  else tcStr = 'the ' + (FRANCHISES.find(f => f.code === config.teamOrConf)?.name || config.teamOrConf);
                  q += ` from ${tcStr}`;
                }

                if (config.statOrAward && config.statOrAward !== '') {
                  const opt = STAT_AWARD_OPTIONS.find(o => o.val === config.statOrAward);
                  if (opt) q += ` who ${opt.label}`;
                  else q += ` who ${config.statOrAward}`;
                }

                if (config.draftYear && config.draftYear !== '') {
                  q += ` selected in the ${config.draftYear} NBA Draft`;
                } else if (config.decade && config.decade !== '') {
                  q += ` in the ${config.decade}s`;
                } else {
                  q += ` in any decade`;
                }

                if (playerExcludes.length > 0) {
                  if (playerExcludes.length === 1) {
                    q += ` not named ${playerExcludes[0]}`;
                  } else {
                    q += ` not named ${playerExcludes.slice(0, -1).join(', ')} or ${playerExcludes[playerExcludes.length - 1]}`;
                  }
                }
                q += '.';
                
                const updateSlot = (field: keyof CustomSlotConfig, value: any) => {
                  const newSlots = [...customDraftSlots];
                  newSlots[index] = { ...newSlots[index], [field]: value };
                  setCustomDraftSlots(newSlots);
                };

                return (
                  <div key={index} className="retro-box-blue rounded-xl p-4 md:p-6 mb-2 font-sans text-xl relative">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-300 font-bold mr-2 text-sm md:text-base">Slot {index + 1}:</span>
                      <span className="text-slate-100">Name a</span>
                      <select value={config.pos} onChange={e => updateSlot('pos', e.target.value)} className="bg-slate-800 text-blue-400 border border-slate-700 px-2 py-1 rounded outline-none font-bold">
                        <option value="">N/A (Any Position)</option>
                        <option value="G">Guard (PG/SG)</option>
                        <option value="W">Wing (SF/SG)</option>
                        <option value="F">Forward (SF/PF)</option>
                        <option value="C">Center/Big (C/PF)</option>
                      </select>
                      <span className="text-slate-100">from the</span>
                      <select value={config.teamOrConf} onChange={e => updateSlot('teamOrConf', e.target.value)} className="bg-slate-800 text-blue-400 border border-slate-700 px-2 py-1 rounded outline-none font-bold">
                        <option value="">N/A (Any Team)</option>
                        <option value="EAST">Eastern Conference</option>
                        <option value="WEST">Western Conference</option>
                        {FRANCHISES.map(f => <option key={f.code} value={f.code}>{f.name}</option>)}
                      </select>
                      <span className="text-slate-100">who</span>
                      <select value={config.statOrAward} onChange={e => updateSlot('statOrAward', e.target.value)} className="bg-slate-800 text-blue-400 border border-slate-700 px-2 py-1 rounded outline-none font-bold">
                        {STAT_AWARD_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                      </select>
                      <span className="text-slate-100">in the</span>
                      <select value={config.decade} onChange={e => updateSlot('decade', e.target.value)} className="bg-slate-800 text-blue-400 border border-slate-700 px-2 py-1 rounded outline-none font-bold">
                        <option value="">N/A (Any Decade)</option>
                        <option value="1980">1980s</option>
                        <option value="1990">1990s</option>
                        <option value="2000">2000s</option>
                        <option value="2010">2010s</option>
                        <option value="2020">2020s</option>
                      </select>
                      <span className="text-slate-100 whitespace-nowrap">drafted or not named:</span>
                      
                      <div className="flex flex-col gap-3 mt-3 w-full border-t border-slate-700/50 pt-3">
                        {config.exclude && config.exclude.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mr-1">Exceptions:</span>
                            {config.exclude.map((name, i) => (
                              <span key={i} className="bg-red-900/50 text-red-300 text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 border border-red-800/50 shadow-sm">
                                {name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newExclude = config.exclude!.filter((_, idx) => idx !== i);
                                    updateSlot('exclude', newExclude);
                                  }}
                                  className="hover:text-red-100 cursor-pointer p-0.5 hover:bg-red-800/50 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {!excludeInputActive[index] ? (
                          <button
                            type="button"
                            onClick={() => {
                              setExcludeInputActive(prev => {
                                const next = [...prev];
                                next[index] = true;
                                return next;
                              });
                            }}
                            className="w-full sm:w-auto self-start py-3 px-6 bg-[#0f172a] text-white font-sans font-black tracking-widest text-sm uppercase rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_0_#1e3a8a] active:shadow-[0_0px_0_#1e3a8a] active:translate-y-[4px] border-2 border-blue-900 flex items-center justify-center gap-2"
                          >
                            <Search className="w-5 h-5" /> Add Exception
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2 w-full max-w-lg">
                            <div className="flex gap-2 w-full">
                              <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  className="w-full h-full bg-slate-800 border-2 border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl font-sans text-base focus:outline-none focus:border-blue-500 placeholder:text-slate-500 transition-colors shadow-inner"
                                  value={excludeInputValues[index]}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setExcludeInputValues(prev => {
                                      const next = [...prev];
                                      next[index] = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setExcludeInputActive(prev => {
                                    const next = [...prev];
                                    next[index] = false;
                                    return next;
                                  });
                                  setExcludeInputValues(prev => {
                                    const next = [...prev];
                                    next[index] = '';
                                    return next;
                                  });
                                }}
                                className="px-5 bg-slate-700 text-white rounded-xl font-black uppercase tracking-wider text-sm hover:bg-slate-600 transition-all border-2 border-slate-600 shadow-[0_4px_0_#334155] active:shadow-[0_0px_0_#334155] active:translate-y-[4px] flex items-center justify-center shrink-0"
                              >
                                Cancel
                              </button>
                            </div>
                            
                            <div className="mt-1 flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar p-1">
                              {(() => {
                                const searchLower = excludeInputValues[index].trim().toLowerCase();
                                const matches = [
                                  ...EXCEPTION_QUALIFIERS.filter(q => q.toLowerCase().includes(searchLower)),
                                  ...data.filter(p => p.lowerName.includes(searchLower)).map(p => p.name)
                                ].slice(0, 20);
                                
                                if (matches.length === 0) {
                                  return <div className="text-slate-500 p-4 text-center text-sm font-bold uppercase tracking-widest bg-slate-900 rounded-xl border border-slate-800">No matches found</div>;
                                }
                                
                                return matches.map((match, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      if (!config.exclude?.includes(match)) {
                                        const newExclude = [...(config.exclude || []), match];
                                        updateSlot('exclude', newExclude);
                                      }
                                      setExcludeInputValues(prev => {
                                        const next = [...prev];
                                        next[index] = '';
                                        return next;
                                      });
                                      setExcludeInputActive(prev => {
                                        const next = [...prev];
                                        next[index] = false;
                                        return next;
                                      });
                                    }}
                                    className="w-full text-left bg-slate-800/80 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-colors flex justify-between items-center group shadow-sm active:scale-[0.98]"
                                  >
                                    <span className="text-slate-200 font-black font-sans text-base">{match}</span>
                                    <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold uppercase tracking-widest">Select &rarr;</span>
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {isGreen && (
                      <div className="mt-4 p-3 bg-green-900/40 border border-green-500/50 rounded-lg text-green-300 text-sm md:text-base font-bold font-sans flex flex-col gap-1 pr-12">
                        <span className="text-green-400/80 text-xs uppercase tracking-widest">Generated Question</span>
                        <span>{q}</span>
                      </div>
                    )}

                    <div className="flex justify-end mt-4 w-full">
                      {isRed && (
                        <div className="flex items-center gap-2 text-red-500 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-red-900/50" title="Technical foul -- question breaks the system">
                          <XCircle className="w-5 h-5 md:w-6 md:h-6" />
                          <span className="text-xs uppercase font-bold tracking-widest hidden md:inline">Technical foul -- question breaks the system</span>
                          <span className="text-xs uppercase font-bold tracking-widest md:hidden">Tech Foul</span>
                        </div>
                      )}
                      {isGreen && (
                        <div className="flex items-center gap-2 text-green-500 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-green-900/50">
                          <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                          <span className="text-xs uppercase font-bold hidden md:inline">Valid Criteria</span>
                        </div>
                      )}
                      {!isRed && !isGreen && hasCriteria && (
                        <div className="flex items-center gap-2 text-yellow-500 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-yellow-900/50">
                          <span className="text-xs uppercase font-bold hidden md:inline">{count} valid players</span>
                          <span className="text-xs uppercase font-bold md:hidden">{count} valid</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <button
                disabled={(() => {
                  let hasAtLeastOneValid = false;
                  for (let idx = 0; idx < customDraftSlots.length; idx++) {
                    const cfg = customDraftSlots[idx];
                    const hasCriteria = cfg.pos !== '' || cfg.teamOrConf !== '' || cfg.statOrAward !== '' || cfg.decade !== '' || (cfg.exclude && cfg.exclude.length > 0);
                    if (hasCriteria) {
                      const fc = buildCustomFilterCriteria(cfg);
                      const mockSlot = { id: `mock-${idx}`, type: 'ANY' as any, label: '', question: '', filterCriteria: fc, player: null, isValid: null };
                      if (getTopPicksForSlot(mockSlot).length < 5) return true;
                      hasAtLeastOneValid = true;
                    }
                  }
                  return !hasAtLeastOneValid;
                })()}
                onClick={() => {
                  const validConfigs = customDraftSlots.filter(cfg => {
                    return cfg.pos !== '' || cfg.teamOrConf !== '' || cfg.statOrAward !== '' || cfg.decade !== '' || (cfg.exclude && cfg.exclude.length > 0);
                  });
                  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(validConfigs));
                  const url = new URL(window.location.href);
                  url.searchParams.set('challenge', compressed);
                  navigator.clipboard.writeText(url.toString()).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="w-full mt-4 bg-yellow-500 text-slate-900 font-sans font-black tracking-widest text-lg uppercase py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors shadow-[0_4px_0_#ca8a04] active:translate-y-1 active:shadow-none"
              >
                {copied ? "LINK COPIED!" : "GENERATE DRAFT LINK"}
              </button>
            </div>
          )}

          {!loading && !isLoadingCreateMode && !isCreateMode && (isTeamBuilder ? teamBuilderSlots : slots).map((slot, index) => {
            const isLocked = index > activeDraftIndex;
            const isActive = index === activeDraftIndex;
            const isCompleted = index < activeDraftIndex;
            
            const isFlashing = index === flashingSlot;
            
            return (
              <div key={slot.id} id={`slot-${index}`} className="flex flex-col w-full scroll-mt-[35vh] sm:scroll-mt-32">
                {index === 0 && (
                  <div className="flex flex-col items-center mt-8 mb-4">
                    <h2 className="text-2xl md:text-3xl font-retro text-white border-b-4 border-blue-600 pb-2 text-center drop-shadow-[2px_2px_0px_#2563eb] w-full">
                      FIVE MAN STARTERS
                    </h2>
                    {isTeamBuilder && (
                      <div className="mt-4 flex justify-center w-full max-w-[200px]">
                        <select
                          value={teamBuilderDecade}
                          onChange={(e) => {
                            handleModeSwitchClick(e.target.value);
                          }}
                          className="retro-box-neutral scanlines bg-slate-900 border-2 border-blue-600 text-blue-400 font-sans font-bold uppercase rounded-lg px-2 py-2 text-xs sm:text-sm text-center outline-none cursor-pointer w-full"
                          style={{ textAlignLast: 'center' }}
                        >
                          <option value="All-Time">All-Time</option>
                          <option value="1980">1980s</option>
                          <option value="1990">1990s</option>
                          <option value="2000">2000s</option>
                          <option value="2010">2010s</option>
                          <option value="2020">2020s</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
                {index === 5 && (
                  <h2 className="text-2xl md:text-3xl font-retro text-white border-b-4 border-blue-600 pb-2 text-center mt-12 mb-4 drop-shadow-[2px_2px_0px_#2563eb]">
                    BENCH MOB
                  </h2>
                )}
                
                {isLocked && (
                  <div className="retro-box-neutral rounded-xl p-4 opacity-75 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <span className="font-sans font-black text-xl text-slate-400">{slot.type === 'W' ? 'G/F' : slot.type}</span>
                      </div>
                      <div className="font-sans text-sm sm:text-base md:text-xl text-slate-400 uppercase tracking-widest flex items-center gap-2 font-medium min-w-0 py-1">
                        <Dribbble className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 animate-bounce" /> 
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">Waiting on Pick Above</span>
                      </div>
                    </div>
                  </div>
                )}

                {isCompleted && slot.player && (
                  <div className={`rounded-xl flex flex-col p-4 gap-4 ${slot.isValid === false ? 'retro-box-red' : 'retro-box-blue'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 mt-1 rounded-full flex flex-shrink-0 items-center justify-center border-2 z-20 ${slot.isValid === false ? 'bg-red-950 border-red-800 text-red-500' : 'bg-blue-950 border-blue-800 text-[#f54646]'}`}>
                          {slot.isValid === false ? <XCircle className="w-6 h-6" /> : <BracketStarIcon className="w-6 h-6" />}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex flex-wrap items-baseline gap-3">
                            <span className="font-sans text-xl md:text-2xl font-black text-white uppercase tracking-tight">{slot.player!.name}</span>
                            {slot.player?.eligiblePositions && slot.player.eligiblePositions.length > 0 && (
                                <span className="font-sans text-sm md:text-base font-black text-slate-400 uppercase tracking-widest">
                                    {slot.player.eligiblePositions.join('/')}
                                </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="font-sans text-sm font-bold text-slate-400">{formatSeasonDisplay(slot.player!.season)}</span>
                            <span className="font-sans text-[10px] font-bold text-white bg-slate-700 px-2 py-0.5 rounded text-center">
                              {displayTeam(slot.player!.team)}
                            </span>
                          </div>
                          {slotPenalties[index] < 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] md:text-xs font-medium bg-slate-950/50 rounded-md px-2 py-1 border border-slate-800">
                                <span className="text-slate-400">Base: {(slot.player!.mpr8 - slotPenalties[index]).toFixed(1)}</span>
                                <span className="text-slate-600">|</span>
                                <span className="text-red-400">Penalty: {slotPenalties[index]}</span>
                                <span className="text-slate-600">|</span>
                                <span className="text-white">Final: {slot.player!.mpr8.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <span className="font-sans text-sm md:text-base text-slate-300 italic opacity-90">"{slot.question}"</span>
                        
                        <div className="flex flex-col md:items-end w-full md:w-auto shrink-0 mt-1 md:mt-0 ml-0 md:ml-2 gap-2 md:gap-1">
                            <div className="flex flex-row items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-2 md:gap-1">
                                {slot.isValid !== false && slot.player.id !== 'skipped' ? (() => {
                                    const grade = getPickGrade(slot.player.mpr8 - slotPenalties[index], getTopPicksForSlot(slot));
                                    const styles = getGradeStyles(grade);
                                    return (
                                        <div className="flex items-center gap-2 pr-4 md:pr-0">
                                            <div className="flex items-center gap-1.5 text-blue-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" clipRule="evenodd" className="w-4 h-4 md:w-5 md:h-5 -rotate-90">
                                                  <path d="M2.25 3A1.5 1.5 0 0 1 3.75 1.5h7.5c.4 0 .78.16 1.06.44l10.5 10.5a1.5 1.5 0 0 1 0 2.12l-7.5 7.5a1.5 1.5 0 0 1-2.12 0L2.69 11.56A1.5 1.5 0 0 1 2.25 10.5V3Zm5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                                                </svg>
                                                <span className="font-retro text-[10px] md:text-xs tracking-widest mt-0.5">DRAFT</span>
                                            </div>
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 shadow-sm ${styles.circle}`}>
                                                <span className={`font-sans font-black text-sm md:text-base drop-shadow-md ${styles.text}`}>
                                                    {grade}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="hidden md:block pr-4 md:pr-0"></div>
                                )}

                                <div className="flex items-baseline gap-2 pr-4 md:pr-0">
                                    <span className="font-sans font-bold text-slate-500 text-xs md:text-sm tracking-widest uppercase">Score</span>
                                    <span className={`text-xl md:text-2xl font-black font-sans leading-none ${slot.isValid === false ? 'text-red-500' : 'text-blue-400'}`}>
                                        {slot.player!.mpr8.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {isActive && (
                  <div className={`retro-box-blue rounded-xl p-4 md:p-6 relative flex flex-col gap-4 font-sans text-xl ${isFlashing ? 'animate-pulse ring-4 ring-emerald-500' : ''}`}>
                    <div className="flex flex-row items-center gap-4 border-b border-slate-700 pb-4 mb-2 z-20">
                      <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-slate-800 rounded-full border-2 border-slate-600 flex items-center justify-center text-slate-400">
                        <JerseyIcon className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <div className="flex flex-col flex-grow text-white">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-sans font-black uppercase text-sm text-blue-400 tracking-wider">
                            {slot.label}
                          </span>
                        </div>
                        <h3 className="text-lg md:text-2xl leading-snug font-sans font-medium text-slate-100">{slot.question}</h3>
                      </div>
                    </div>
                    
                    {slotPenalties[activeDraftIndex] < 0 && (
                      <div className="flex items-center justify-center gap-2 font-sans font-bold text-red-400 text-sm md:text-base mt-0 mb-2 uppercase bg-red-950/50 border border-red-900/50 rounded-lg p-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Penalty: {slotPenalties[activeDraftIndex]} | bad pick select again!</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 mt-2">
                      {uiError && (
                        <div className="mt-2 text-center font-sans tracking-widest bg-red-950/40 border border-red-800 rounded px-3 py-2 flex flex-col gap-1 transition-opacity duration-300">
                          <span className="text-xs font-bold uppercase text-red-500">⚠️ {uiError.title}</span>
                          {uiError.subtitle && (
                            <span className="text-[10px] text-red-400/80 uppercase font-medium">{uiError.subtitle}</span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        {!isSearching ? (
                          <button
                            onClick={() => setIsSearching(true)}
                            className="flex-1 py-4 bg-blue-600 text-white font-sans font-black tracking-widest text-sm md:text-base uppercase rounded-xl hover:bg-blue-500 transition-all shadow-[0_4px_0_#1e3a8a] active:shadow-[0_0px_0_#1e3a8a] active:translate-y-[4px] border-2 border-blue-900 flex items-center justify-center gap-2"
                          >
                            <Search className="w-5 h-5" />
                            Select Player
                          </button>
                        ) : (
                          <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                              ref={inputRef}
                              type="text"
                              placeholder={`Search for a ${slot.type === 'G' ? 'Guard' : slot.type === 'W' ? 'G/F' : slot.type === 'F/C' ? 'Forward or Center' : slot.type === 'F' ? 'Forward' : slot.type === 'C' ? 'Center' : 'Player'}...`}
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className="w-full h-full bg-slate-800 border-2 border-slate-700 text-white pl-11 pr-4 py-4 rounded-xl font-sans text-lg focus:outline-none focus:border-blue-500 placeholder:text-slate-500 transition-colors"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => handleSkipSlotClick()}
                          className="w-full sm:w-auto px-6 py-4 bg-[#f54646] text-white font-sans font-black tracking-widest text-sm md:text-base uppercase rounded-xl hover:bg-[#ff6666] transition-all shadow-[0_4px_0_#7f1d1d] active:shadow-[0_0px_0_#7f1d1d] active:translate-y-[4px] border-2 border-red-900 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <FastForward className="w-5 h-5 fill-white flex-shrink-0" />
                          Skip (-25 Pts)
                        </button>
                      </div>

                      {searchQuery.trim().length > 0 && searchResults.length === 0 && (
                        <div className="p-4 text-center text-slate-400 font-sans text-sm">No players found matching your query.</div>
                      )}
                      {searchResults.length > 0 && (
                        <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 mt-2">
                          {searchResults.map(p => (
                            <li key={p.id}>
                              <button
                                onClick={() => handleSelectPlayer(p)}
                                className="w-full text-left px-4 py-3 bg-slate-800 rounded-xl text-white font-sans text-lg lg:text-xl font-bold uppercase hover:bg-slate-700 flex items-center justify-between transition-colors border border-slate-700 hover:border-slate-500"
                              >
                                <span>{p.name} <span className="text-slate-500 text-sm font-bold">[{getEligiblePositions(p.seasons).join('/')}]</span></span>
                                <span className="font-sans font-medium text-blue-400 text-xs tracking-widest">Select &rarr;</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && activeDraftIndex === (isTeamBuilder ? teamBuilderSlots : slots).length && (
            <div id="endgame-modal" className="mt-12 text-center retro-box-neutral scanlines rounded-2xl p-10 flex flex-col items-center scroll-mt-6">
              <div className="relative z-20 flex flex-col items-center w-full">
                <h2 className="text-4xl md:text-5xl font-retro text-white drop-shadow-[2px_2px_0px_#2563eb] mb-6">
                  {isTeamBuilder ? "Dream Team Built" : "Team's Final Buzzer Grade"}
                </h2>
              
              {!isTeamBuilder && (
                <>
                  <div className="flex justify-center mb-2">
                    {getRank(totalScore).icon}
                  </div>
                  <h3 className="text-3xl font-retro text-white mb-8">{getRank(totalScore).title}</h3>
                </>
              )}
              
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8 w-full max-w-sm">
                <p className="text-slate-400 font-sans text-xl uppercase tracking-widest font-bold mb-2">Final Score</p>
                <p className="text-6xl font-retro text-yellow-400 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">{totalScore.toFixed(1)}</p>
              </div>

              {/* GM Tier Legend */}
              {!isTeamBuilder && (
                <div className="w-full max-w-2xl bg-slate-800/80 rounded-xl p-6 border border-slate-700 mb-8 text-left">
                  <h4 className="text-lg text-slate-300 font-sans font-black uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">GM Grade</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { threshold: '≥ 250', title: 'Dynasty Architect', icon: <Crown className="w-6 h-6 text-yellow-400" />, id: 'dynasty' },
                    { threshold: '≥ 150', title: 'Playoff Contender', icon: <Trophy className="w-6 h-6 text-blue-400" />, id: 'playoff' },
                    { threshold: '≥ 100', title: 'Play-In Team', icon: <Ticket className="w-6 h-6 text-white" />, id: 'playin' },
                    { threshold: '< 100', title: 'Lottery Team', icon: <TrendingDown className="w-6 h-6 text-red-500" />, id: 'lottery' },
                  ].map((tier) => (
                    <div key={tier.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${getRank(totalScore).id === tier.id ? 'retro-box-dual my-1' : 'bg-slate-900/50 border border-slate-800'}`}>
                      {tier.icon}
                      <div>
                        <div className={`text-lg font-black font-sans uppercase tracking-wide ${getRank(totalScore).id === tier.id ? 'text-white' : 'text-slate-300'}`}>{tier.title}</div>
                        <div className="text-sm text-slate-500 font-mono">Score {tier.threshold}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Roster Summary */}
              <div className="w-full max-w-2xl bg-slate-800/80 rounded-xl p-6 border border-slate-700 mb-8 text-left">
                <h4 className="text-lg text-slate-300 font-sans font-black uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">Final Roster</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {(isTeamBuilder ? teamBuilderSlots : slots).map((slot, idx) => (
                    <div key={slot.id} className="flex flex-col bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3">
                        <div className="max-w-full sm:max-w-[50%] overflow-hidden">
                          <div className="font-bold text-slate-200 truncate">{slot.player?.name || 'Empty'}</div>
                          {slot.player && <div className="text-xs text-slate-400 truncate">{formatSeasonDisplay(slot.player.season)} &bull; {slot.player.pos} &bull; {displayTeam(slot.player.team)}</div>}
                        </div>
                        <div className="flex flex-row items-center justify-around sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 text-center sm:text-right shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-700/50 sm:border-0">
                          {slot.player && (
                            slotPenalties[idx] === 0 ? (
                              <div className="flex flex-col items-center sm:items-end justify-center">
                                <span className="text-[10px] sm:text-xs font-bold text-blue-400 tracking-widest uppercase mb-1">Score:</span>
                                <span className="text-base sm:text-sm font-black text-blue-400 leading-none">{slot.player.mpr8.toFixed(1)}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center sm:items-end sm:flex-row sm:gap-2 text-[11px] md:text-xs font-medium">
                                <span className="text-slate-400">Base: {(slot.player.mpr8 - slotPenalties[idx]).toFixed(1)}</span>
                                <span className="hidden sm:inline text-slate-600">|</span>
                                <span className="text-red-400 font-bold">Penalty: {slotPenalties[idx]}</span>
                                <span className="hidden sm:inline text-slate-600">|</span>
                                <span className="text-blue-400 font-bold">Final: {slot.player.mpr8.toFixed(1)}</span>
                              </div>
                            )
                          )}
                          {!isTeamBuilder && (
                            <button 
                              onClick={() => setExpandedTopPicksIndex(expandedTopPicksIndex === idx ? null : idx)}
                              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <span className="text-[10px] text-slate-400 font-bold mb-1 tracking-widest leading-none">TOP PICKS</span>
                              <ListOrdered className="w-4 h-4 text-slate-300" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {!isTeamBuilder && (
                        <AnimatePresence>
                          {expandedTopPicksIndex === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-950 overflow-hidden border-t border-slate-700/50"
                          >
                             <div className="p-3">
                               <h4 className="text-xs uppercase text-slate-400 font-bold mb-2 tracking-widest border-b border-slate-700 pb-1">
                                 TOP 10 ANSWERS &mdash; <span className="font-normal normal-case text-slate-400">{slot.question}</span>
                               </h4>
                               <div className="flex flex-col gap-1.5">
                                 {getTopPicksForSlot(slot).slice(0, 10).map((pick, i) => (
                                   <div key={i} className="flex flex-col sm:flex-row sm:items-center w-full gap-1 sm:gap-3 py-3 border-b border-slate-700/50 last:border-0 text-xs sm:text-sm">
                                      <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                                        <span className={`w-4 sm:w-6 flex-shrink-0 text-left font-bold font-sans ${i === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>{i + 1}.</span>
                                        <span className={`truncate text-left font-sans font-medium ${i === 0 ? 'text-yellow-100' : 'text-slate-300'}`}>{pick.name}</span>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 mt-1 sm:mt-0">
                                        <div className="font-sans whitespace-nowrap order-1 sm:order-3 w-auto sm:w-24 sm:text-right">
                                          <span className="text-slate-400 font-normal text-[10px] sm:text-xs uppercase tracking-wider">Score: </span>
                                          <span className={`font-bold ${i === 0 ? 'text-yellow-400' : 'text-slate-200'}`}>{pick.mpr8.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 order-2 text-slate-400">
                                          <span className="w-8 sm:w-10 text-right font-sans">'{pick.season.slice(2)}</span>
                                          <div className="w-10 sm:w-12 flex justify-center">
                                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-bold font-sans">{displayTeam(pick.team)}</span>
                                          </div>
                                        </div>
                                      </div>
                                   </div>
                                 ))}
                                 {getTopPicksForSlot(slot).length === 0 && (
                                    <div className="text-slate-500 text-sm font-sans italic">No top picks found.</div>
                                 )}
                               </div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center w-full gap-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                  <button 
                    onClick={shareResults} 
                    className="w-full sm:w-auto px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-sans font-black rounded-xl uppercase text-base shadow-lg flex items-center justify-center gap-3 transition-colors"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy Results'}
                  </button>
                  <button 
                    onClick={handleRestart} 
                    className="w-full sm:w-auto px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-sans font-black rounded-xl uppercase text-base shadow-lg flex items-center justify-center gap-3 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Restart
                  </button>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Footer - Glossary & Disclaimer */}
          <footer className="mt-12 sm:mt-16 mb-8 flex flex-col items-center justify-center text-center px-4 w-full">
            <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 mb-6 w-full">
              <button 
                onClick={() => {
                  setFeedbackMessage('');
                  setFeedbackImage(null);
                  setFeedbackSuccess(false);
                  setShowFeedbackModal(true);
                }}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs sm:text-sm font-sans font-bold uppercase tracking-widest bg-slate-800/80 hover:bg-slate-700/80 px-4 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 shadow-lg cursor-pointer"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                Contact/Feedback
              </button>
              <a 
                href="https://x.com/8MPR_Hoops"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-slate-300 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-700/80 p-2.5 rounded-lg border border-slate-700 hover:border-slate-500 shadow-lg"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </a>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl py-4 px-6 text-[10px] sm:text-xs text-gray-300 font-sans tracking-wide space-y-2 max-w-4xl mx-auto shadow-xl border border-slate-700/50">
              <p className="italic opacity-80 leading-relaxed max-w-3xl mx-auto">
                Disclaimer: 8MPR as a platform is not at all affiliated with the National Basketball Association (NBA). Information is up-to-date through the end of the 2025-2026 regular season and stats were pulled through publicly available made databases. No user information or data is maintained other than GM Name Login Credentials and accumulative scores and rankings. This platfrom is oldschool not wanting or needing your email to create a profile -- we think that is foul behavior by folks selling your data. As such: set a GM Name + password, and don't forget it!
              </p>
            </div>
          </footer>

        </main>
      </div>

      {/* Skip Confirmation Modal */}
      <AnimatePresence>
        {showSkipConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#19223e] border-2 border-[#2b3553] shadow-[0_0_0_2px_#10152b] rounded-2xl p-6 md:p-8 max-w-sm w-full relative flex flex-col items-center text-center"
            >
              <AlertCircle className="w-12 h-12 text-[#f54646] mb-4" />
              <h3 className="text-xl font-sans font-black text-white uppercase tracking-wider mb-2">Confirm Skip</h3>
              <p className="text-slate-300 font-medium mb-6 text-sm">
                Are you sure you want to skip? This will leave the slot empty and apply a <strong className="text-[#f54646] font-black">-25 point penalty</strong>!
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setShowSkipConfirm(false)}
                  className="flex-1 py-3 bg-slate-800 text-white font-sans font-bold uppercase rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                {loading && (
                  <div className="w-full mt-2 mb-1 px-1 shrink-0">
                    <div className="flex justify-between text-[10px] sm:text-xs text-blue-400 font-retro tracking-widest mb-1 uppercase">
                      <span>LOADING ROSTERS...</span>
                      <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="w-full h-3 sm:h-4 bg-[#0f172a] border-2 border-[#1e40af] rounded-sm p-[1px] shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                      <div 
                        className="h-full bg-[#3b82f6] transition-all duration-200"
                        style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                      />
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setShowSkipConfirm(false);
                    executeSkipSlot();
                  }}
                  className="flex-1 py-3 bg-[#f54646] text-white font-sans font-bold uppercase rounded-xl hover:bg-red-600 transition-colors"
                >
                  Yes, Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="retro-box-blue rounded-2xl max-w-md w-full p-6 relative flex flex-col"
            >
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-retro text-white mb-2 uppercase tracking-widest text-center mt-2">Contact/Feedback</h3>
              <p className="text-slate-300 font-sans text-sm text-center mb-6">
                Found a bug? Have a suggestion? Want to contact us? Let us know below.
              </p>
              
              {feedbackSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-16 h-16 bg-green-900 border-2 border-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-white font-sans font-bold uppercase tracking-widest text-center">
                    Feedback sent successfully!
                  </p>
                  <p className="text-slate-400 text-sm text-center">
                    Thank you for helping improve 8MPR.
                  </p>
                  <button 
                    onClick={() => setShowFeedbackModal(false)}
                    className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold uppercase tracking-widest rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form 
                  name="feedback" 
                  data-netlify="true" 
                  className="flex flex-col gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!feedbackMessage.trim()) return;
                    setIsSubmittingFeedback(true);
                    
                    const formElement = e.currentTarget;
                    const formData = new FormData(formElement);
                    
                    try {
                      await fetch('/', {
                        method: 'POST',
                        body: formData
                      });
                      setIsSubmittingFeedback(false);
                      setFeedbackSuccess(true);
                    } catch (error) {
                      console.error("Error submitting feedback:", error);
                      setIsSubmittingFeedback(false);
                    }
                  }}
                >
                  <input type="hidden" name="form-name" value="feedback" />
                  <textarea
                    name="message"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Feedback or message..."
                    className="w-full h-32 bg-slate-900 border-2 border-blue-600/50 rounded-xl p-3 text-white font-sans placeholder-slate-500 focus:outline-none focus:border-blue-400 resize-none"
                  />
                  
                  <label className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700 hover:border-slate-500 transition-colors px-4 truncate">
                    <ImagePlus className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-slate-300 font-sans font-bold text-sm uppercase truncate">
                      {feedbackImage ? feedbackImage.name : "Attach Screenshot (Optional)"}
                    </span>
                    <input 
                      type="file" 
                      name="screenshot"
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setFeedbackImage(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  
                  <button 
                    type="submit"
                    disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-bold uppercase tracking-widest rounded-lg border-2 border-blue-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 court-bg"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="mx-auto w-[95%] sm:w-[90%] max-w-[400px] md:max-w-[600px] lg:max-w-[700px] relative max-h-[88vh] md:max-h-[92vh] flex flex-col rounded-[2rem] md:rounded-[2.5rem] bg-[#0f172a]"
              style={{
                border: '4px solid #1e40af',
                boxShadow: '0 0 0 4px #3b82f6, 0 0 0 8px #020617, 0 10px 25px 8px rgba(0,0,0,0.6)'
              }}
            >
              <div className="w-full flex-1 flex flex-col p-2 min-h-0">
                
                {/* Whiteboard Surface */}
                <div className="relative flex flex-col w-full flex-1 min-h-0 bg-[#111625] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                  
                  {/* Court Lines Background (SVG) */}
                  <div className="absolute inset-x-0 bottom-0 top-12 md:top-14 z-0 pointer-events-none opacity-[0.08] p-3 sm:p-5 md:p-8 flex items-center justify-center">
                     <svg className="w-full h-full text-white" viewBox="0 0 300 500" preserveAspectRatio="none" fill="none" stroke="currentColor">
                        {/* Court Outer Boundary */}
                        <rect x="10" y="10" width="280" height="480" strokeWidth="3" />
                        {/* Half Court Line & Center Circle */}
                        <line x1="10" y1="250" x2="290" y2="250" strokeWidth="2.5" />
                        <circle cx="150" cy="250" r="36" strokeWidth="2.5" />
                        
                        {/* Top Key / Paint */}
                        <rect x="105" y="10" width="90" height="105" strokeWidth="2.5" />
                        <path d="M 105 115 A 45 45 0 0 0 195 115" strokeWidth="2.5" />
                        <path d="M 105 115 A 45 45 0 0 1 195 115" strokeWidth="2.5" strokeDasharray="5 5" />
                        {/* Top 3-Point Arc */}
                        <path d="M 30 10 L 30 75 A 125 125 0 0 0 270 75 L 270 10" strokeWidth="2.5" />
                        {/* Top Backboard & Rim */}
                        <line x1="130" y1="22" x2="170" y2="22" strokeWidth="3.5" />
                        <circle cx="150" cy="30" r="8" strokeWidth="2" />

                        {/* Bottom Key / Paint */}
                        <rect x="105" y="385" width="90" height="105" strokeWidth="2.5" />
                        <path d="M 105 385 A 45 45 0 0 1 195 385" strokeWidth="2.5" />
                        <path d="M 105 385 A 45 45 0 0 0 195 385" strokeWidth="2.5" strokeDasharray="5 5" />
                        {/* Bottom 3-Point Arc */}
                        <path d="M 30 490 L 30 425 A 125 125 0 0 1 270 425 L 270 490" strokeWidth="2.5" />
                        {/* Bottom Backboard & Rim */}
                        <line x1="130" y1="478" x2="170" y2="478" strokeWidth="3.5" />
                        <circle cx="150" cy="470" r="8" strokeWidth="2" />
                     </svg>
                  </div>

                  {/* Content Container */}
                  <div className="relative z-10 flex flex-col items-center w-full flex-1 min-h-0 px-3 sm:px-5 pb-3 sm:pb-5 pt-4 sm:pt-6 md:px-8 md:pb-8">
                    <h2 className="text-[11px] min-[380px]:text-xs sm:text-base md:text-xl font-sans font-black text-center mb-1 md:mb-2 leading-tight uppercase tracking-wide sm:tracking-widest text-[#ffb75e] drop-shadow-[0_2px_1px_rgba(0,0,0,0.8)] shrink-0 whitespace-nowrap">
                      Welcome to the 8-Man Playoff Rotation!
                    </h2>
                    <div className="flex items-center justify-center shrink-0 mb-2 md:mb-3">
                      <img src={logoImg} alt="8MPR Hoops Logo" className="w-32 sm:w-40 md:w-48 object-contain drop-shadow-md" />
                    </div>
                
                <div className="w-full flex-1 min-h-0 overflow-y-auto bg-[#19223e]/90 backdrop-blur-md rounded-xl p-4 sm:p-5 md:p-6 border-2 border-slate-700/60 shadow-lg text-left custom-scrollbar">
                  <h3 className="text-blue-400 font-bold uppercase tracking-widest mb-3 md:mb-4 text-[10px] sm:text-sm md:text-sm text-center">THREE POINT BREAKDOWN OF <span className="bg-gradient-to-b from-[#ffb75e] to-[#ed8f03] bg-clip-text text-transparent">8MPR Hoops</span>:</h3>
                  
                  <ol className="list-decimal pl-5 md:pl-8 space-y-3 md:space-y-4 text-[13px] sm:text-sm md:text-sm text-slate-300 leading-relaxed md:leading-relaxed font-sans mb-3 md:mb-4 font-medium">
                    <li>
                      <strong className="text-white">Drafting:</strong> Select a player by typing their name. The draft engine will automatically find their highest-scoring eligible season for that slot based on its question criteria.
                      <p className="mt-0.5 md:mt-1.5 text-slate-400 italic text-xs sm:text-[13px] md:text-[13px]">- For example: &quot;Name a Chicago Bulls Guard selected in the First Round of the NBA Draft&quot; will automatically identify Michael Jordan's best year after you select him.</p>
                    </li>
                    <li>
                      <strong className="text-white">Penalty:</strong> If you select a player who doesn't fit the question (wrong team, wrong era, wrong position), you will receive a <strong className="text-red-400">-5 point penalty</strong> for throwing up such weak sauce. Try your hand at another pick or skip. 
                    </li>
                  </ol>

                  <div className="bg-slate-800/90 border border-slate-600 p-3 md:p-4 rounded-xl mb-3 md:mb-4 shadow-inner">
                    <p className="font-mono text-center text-white font-bold text-[10px] sm:text-[10px] md:text-[10px] mb-1.5 md:mb-2 leading-snug">8MPR Score = (PTS + TRB&times;1.5 + AST&times;1.5 + STL&times;2.5 + BLK&times;2.5) / 100</p>
                    <p className="text-center text-slate-400 text-[13px] md:text-sm">For example, Jordan's 8MPR Score in the 1990-1991 Season is: 47.6</p>
                  </div>

                  <ol start={3} className="list-decimal pl-5 md:pl-8 text-[13px] sm:text-sm md:text-sm text-slate-300 leading-relaxed md:leading-relaxed font-sans mb-3 md:mb-5 font-medium">
                    <li>
                      <strong className="text-white">Architect a Dynasty:</strong> As the real NBA game has become positionless, so too is this one. While specific positions are in 8MPR Hoops, your rotation allows for as much creativity as possible without clogging up our system's paint. Go small-ball like the golden era of Golden State, or play big and roll out a lineup like the 2002 Western Conference All-Stars with a front court of Shaq, Duncan, and KG. Totally up to you as this is the 'Player-Empowerment Era' after all.
                    </li>
                  </ol>
                  <div className="text-[13px] sm:text-sm md:text-sm text-slate-300 leading-relaxed md:leading-relaxed font-sans mb-3 md:mb-4 space-y-2 md:space-y-3 font-medium">
                    <p>At the end of typing in and selecting 8 Players &mdash; 5 Starters and a Bench Mob &mdash; you will be awarded a final Team 8MPR Score and a GM grade.</p>
                    <p>Share and compete to see who really knows ball! Tip-off quickly with a 'Free Play' or create a GM Name to compete on a world-wide court.</p>
                  </div>
                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-700 text-[10px] sm:text-[11px] md:text-[11px] text-slate-500 font-bold text-center uppercase tracking-wider">
                    SCORING GLOSSARY: PTS = TOTAL POINTS | TRB = TOTAL REBOUNDS | AST = TOTAL ASSISTS | STL = TOTAL STEALS | BLK = TOTAL BLOCKS
                  </div>
                </div>

                {loading && (
                  <div className="w-full mt-2 mb-1 px-1 shrink-0 relative z-20">
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-retro tracking-widest mb-1 uppercase">
                      <span>LOADING ROSTERS...</span>
                      <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="w-full h-3 sm:h-4 bg-slate-800 border-2 border-slate-600 rounded-sm p-[1px]">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="w-full px-2 md:px-3 pt-3 pb-4">
                  <button 
                    onClick={() => {
                      if (!loading) {
                        setShowWelcome(false);
                        window.scrollTo(0, 0);
                      }
                    }}
                    disabled={loading}
                    className={`relative z-20 flex items-center justify-center gap-2 w-full bg-[#111625] text-white font-sans font-black rounded-[1.25rem] py-3 md:py-4 px-4 text-lg sm:text-xl uppercase transition-all shrink-0 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98] cursor-pointer'}`}
                    style={{
                      border: '4px solid #3b82f6',
                      boxShadow: '0 0 0 4px #ef4444, 0 0 0 8px #020617'
                    }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Draft
                  </button>
                </div>
              </div>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 court-bg"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-[400px] md:max-w-[500px] relative max-h-[85vh] flex flex-col rounded-[2rem] bg-[#0f172a] overflow-hidden"
              style={{
                border: '4px solid #1e40af',
                boxShadow: '0 0 0 4px #3b82f6, 0 0 0 8px #020617, 0 10px 25px 8px rgba(0,0,0,0.6)'
              }}
            >
              <div className="w-full bg-[#111625] flex-1 flex flex-col p-5 sm:p-6 items-center overflow-y-auto relative no-scrollbar">
                {gmName ? (
                  <>
                    <button 
                      onClick={() => setShowAuthModal(false)}
                      className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition-colors z-10 flex items-center justify-center gap-1 font-sans text-lg underline underline-offset-4"
                      title="Go back"
                    >
                      ← Back
                    </button>
                    
                    <div className="w-16 h-16 rounded-full bg-blue-900 border-2 border-blue-500 flex items-center justify-center mb-4 mt-2">
                      <Trophy className="w-8 h-8 text-blue-300" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-sans font-bold text-white text-center mb-1 tracking-wide uppercase">
                      Front Office Dashboard
                    </h2>
                    
                    <p className="text-slate-400 font-sans text-center text-sm md:text-base mb-6 max-w-[280px]">
                      Global rankings and GM analytics.
                    </p>

                    {isLoadingLeaderboard ? (
                      <div className="flex flex-col items-center justify-center py-12 w-full max-w-sm mx-auto">
                        <div className="w-full bg-slate-800 rounded-full h-4 border-2 border-slate-700 overflow-hidden mb-4 relative">
                          <motion.div 
                            className="h-full bg-blue-500 rounded-full relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${loadProgress}%` }}
                            transition={{ ease: "easeOut", duration: 0.2 }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
                          </motion.div>
                        </div>
                        <p className="text-slate-400 font-sans font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                          {loadProgress < 100 ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              Loading front office data... {Math.round(loadProgress)}%
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Data Loaded!
                            </>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-6 max-w-lg mt-2">
                        {/* Current GM Profile Summary */}
                        {(() => {
                          const myProfile = leaderboardData.find(g => g.gmName.toLowerCase() === gmName.toLowerCase()) || {
                            gmName: gmName,
                            globalRank: '-',
                            averageScore: '0.0',
                            gamesPlayed: 0,
                            totalSkips: 0,
                            dynastyCount: 0
                          };
                          
                          return (
                            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-xl p-4 flex flex-col relative overflow-hidden retro-box-dual">
                              <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 font-black font-sans px-3 py-1 text-sm uppercase rounded-bl-lg">
                                Rank #{myProfile.globalRank}
                              </div>
                              <h3 className="text-xl font-black font-sans text-white mb-3 pr-24 break-words mt-1 sm:mt-0">GM Profile: @{myProfile.gmName}</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Avg Score</p>
                                  <p className="text-xl font-black text-blue-400">{myProfile.averageScore}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Games Played</p>
                                  <p className="text-xl font-black text-white">{myProfile.gamesPlayed}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Skips</p>
                                  <p className="text-xl font-black text-red-400">{myProfile.totalSkips}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Dynasties</p>
                                  <p className="text-xl font-black text-yellow-400">{myProfile.dynastyCount}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Global Leaderboard */}
                        <div className="bg-[#0f172a] border-2 border-slate-600 rounded-xl overflow-hidden flex flex-col max-h-[35vh]">
                          <div className="bg-slate-800 p-3 border-b-2 border-slate-600">
                            <h3 className="text-lg font-black font-sans text-white uppercase text-center flex items-center justify-center gap-2">
                              <Crown className="w-5 h-5 text-yellow-500" />
                              Global Leaderboard
                            </h3>
                          </div>
                          <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-2">
                            {leaderboardData.length === 0 ? (
                              <p className="text-slate-400 text-center py-4 text-sm font-sans">No GM data available yet.</p>
                            ) : (
                              leaderboardData.map((gm, idx) => {
                                const isCurrentUser = gm.gmName.toLowerCase() === gmName.toLowerCase();
                                return (
                                  <div key={gm.gmName} className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 ${isCurrentUser ? 'bg-blue-900/40 border-blue-500/50' : 'bg-slate-800/40'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black font-sans text-sm flex-shrink-0 ${idx === 0 ? 'bg-yellow-500 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-300'}`}>
                                      {gm.globalRank}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white font-bold font-sans truncate">@{gm.gmName}</p>
                                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-sans mt-0.5">
                                        <span className="text-slate-400"><span className="text-blue-300">Avg:</span> {gm.averageScore}</span>
                                        <span className="text-slate-400"><span className="text-slate-300">Games Played:</span> {gm.gamesPlayed}</span>
                                        <span className="text-slate-400"><span className="text-red-300">Skips:</span> {gm.totalSkips}</span>
                                        <span className="text-slate-400"><span className="text-yellow-300">Dynasties:</span> {gm.dynastyCount}</span>
                                      </div>
                                    </div>
                                    {gm.dynastyCount > 0 && (
                                      <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-md text-xs font-bold border border-yellow-500/30" title={`${gm.dynastyCount} Dynasty Architect Titles`}>
                                        <Crown className="w-3 h-3" />
                                        {gm.dynastyCount}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={async () => {
                            if (isSupabaseConfigured) {
                              await supabase.auth.signOut();
                            }
                            setGmName('');
                            setLoginInput('');
                            setPassword('');
                            setAuthMode('choose');
                          }}
                          className="mt-2 text-slate-400 hover:text-white font-sans text-sm underline underline-offset-4 mb-2"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (authMode === 'unified') {
                          setAuthMode('choose');
                          setAuthError(null);
                          setLoginInput('');
                          setPassword('');
                        } else {
                          setShowAuthModal(false);
                        }
                      }}
                      className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition-colors z-10 flex items-center justify-center gap-1 font-sans text-lg underline underline-offset-4"
                      title="Go back"
                    >
                      ← Back
                    </button>
                    <div className="w-16 h-16 rounded-full bg-blue-900 border-2 border-blue-500 flex items-center justify-center mb-4 mt-2">
                      <Lock className="w-8 h-8 text-blue-300" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-sans font-bold text-white text-center mb-1 tracking-wide">
                      FRONT OFFICE ACCESS
                    </h2>
                    {authMode === 'unified' && (
                      <p className="text-slate-400 font-sans text-center text-sm md:text-base mb-6 max-w-[280px]">
                        Enter a handle and password to login or create a new GM profile.
                      </p>
                    )}
                    {authMode === 'choose' && <div className="mb-6"></div>}

                    {authMode === 'choose' && (
                      <div className="w-full flex flex-col gap-4">
                        <button
                          onClick={() => setAuthMode('unified')}
                          className="w-full bg-[#0f172a] text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all retro-box-blue uppercase"
                        >
                          CREATE GM HANDLE / FRONT OFFICE LOGIN
                        </button>
                        <button
                          onClick={() => setShowAuthModal(false)}
                          className="w-full bg-[#1e293b] text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all border-2 border-slate-600 shadow-md uppercase"
                        >
                          FREE PLAY (GUEST)
                        </button>
                      </div>
                    )}

                    {authMode === 'unified' && (
                      <div className="w-full flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-blue-300 font-sans uppercase text-sm tracking-wider font-bold">GM Handle</label>
                          <input
                            type="text"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            className="w-full bg-slate-800 text-white font-sans text-xl px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-colors placeholder:text-slate-500"
                            placeholder="e.g. PatRiley99"
                          />
                        </div>

                        <div className="flex flex-col gap-1 mb-2">
                          <label className="text-blue-300 font-sans uppercase text-sm tracking-wider font-bold">Password</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 text-white font-sans text-xl px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-colors"
                            placeholder="••••••••"
                          />
                        </div>

                        {authError && (
                          <div className="w-full bg-red-950/50 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-200 text-sm font-sans leading-tight">{authError}</p>
                          </div>
                        )}

                        <button
                          onClick={handleAuthSubmit}
                          className="w-full text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all retro-box-dual uppercase"
                        >
                          ENTER FRONT OFFICE
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playbook Modal */}
      <AnimatePresence>
        {showPlaybook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center min-h-screen p-4 bg-slate-950/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#19223e] border-2 border-[#2b3553] shadow-[0_0_0_2px_#10152b] rounded-2xl w-[92%] sm:w-auto mx-auto my-auto max-w-[340px] sm:max-w-[400px] p-5 sm:p-6 relative overflow-y-auto max-h-[90vh] flex flex-col items-center"
            >
              <button 
                onClick={() => setShowPlaybook(false)}
                className="absolute top-4 left-4 z-50 p-1.5 bg-[#10152b]/50 hover:bg-[#10152b] rounded-full text-slate-400 hover:text-white transition-all"
                aria-label="Close Playbook"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative z-20 flex flex-col items-center w-full">
                <ClipboardList className="w-16 h-16 text-yellow-400 mb-4" />
                <h2 className="text-[1.35rem] sm:text-2xl font-sans font-black text-center mt-2 leading-[1.1] uppercase tracking-tight text-white drop-shadow-[0_2px_1px_rgba(0,0,0,0.8)]">
                  8MPR Playbook
                </h2>
                
                <div className="mt-6 mb-6 w-full flex flex-col gap-4 text-[13px] text-slate-300 text-left">
                  <p><strong className="text-white">Welcome to the 8MPR Playbook:</strong> This is your resource for understanding the mechanics behind the draft. The information below breaks down our engine's logic so you can build the ultimate rotation.</p>

                  <p><strong className="text-white">How the Selection Engine Works:</strong> Every slot in your rotation is governed by a Validation Engine. When you search for a player, the platform cross-references your pick against NBA historical datasets (Regular Season Stats + Awards, Draft History, etc).</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">The Auto-Peak Engine:</strong> Simply search and select a qualifying player. The engine scans their full game log and automatically locks in their highest-scoring 8MPR season that strictly satisfies all criteria for that slot (team, position, decade, and stat thresholds).</li>
                  </ul>

                  <p><strong className="text-white">The 8MPR Formula:</strong> The scoring system is designed to reward high-impact hustle and playmaking. The formula is: (PTS + TRB&times;1.5 + AST&times;1.5 + STL&times;2.5 + BLK&times;2.5) / 100.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">Why These?</strong> Steals and blocks are weighted heavily to reward defensive playmakers. Meanwhile, rebounds and assists reward players who facilitate for teammates and secure extra possessions for their team.</li>
                  </ul>

                  <h4 className="text-blue-400 font-bold uppercase tracking-widest mt-4 mb-1">Other Game Modes</h4>
                  
                  <p><strong className="text-white">Team Builder:</strong> This mode removes trivia constraints to let creators build an absolute fantasy lineup bounded purely by position groupings and a chosen historical decade (or All-Time rules). Build and test specific teams against one another in a historical context or build the ultimate dream team.</p>
                  
                  <p><strong className="text-white">Create Draft:</strong> Forge custom 1-to-8 slot draft boards with unique constraints (teams, decades, award cutoffs, and tailored player/draft exceptions). Share links and challenge fellow hoopheads with a draft you commisioned.As little as one pick your full 8-Man rotation.</p>

                  <h4 className="text-blue-400 font-bold uppercase tracking-widest mt-4 mb-1">Edge Cases & Validation Logic</h4>

                  <p><strong className="text-white">Case Study: Decade Categorization & Dražen Petrović</strong></p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-white">The Scenario:</strong> You try to draft Dražen Petrović for a 1980s Portland Trail Blazers prompt because he debuted in 1989, but the engine rejects the pick.
                    </li>
                    <li>
                      <strong className="text-white">The Logic:</strong> Standard historical basketball databases log seasons by the year the season concludes and playoffs take place. Petrović's rookie campaign (the 1989–90 season) is officially logged in the system as "1990".
                    </li>
                    <li>
                      <strong className="text-white">The Takeaway:</strong> Because his first season in the database is "1990", the validation engine classifies him as playing in the 1990s rather than the 1980s. This is to avoid data fragmentation and ensure our system doesn't get clogged in the paint. Watch out for rookies who made their debut during cross-decade transition seasons!
                    </li>
                  </ul>

                  <p><strong className="text-white">Case Study: Team Alignment & Drew Gooden</strong></p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">The Scenario:</strong> You might wonder why a player like Drew Gooden is associated with a specific team rather than the team that drafted him.</li>
                    <li><strong className="text-white">The Logic:</strong> Our platform maps players to the team they were rostered with when they achieved a specific accolade. While Drew Gooden was originally drafted by the Memphis Grizzlies, he finished his rookie season with the Orlando Magic and received his end-of-season All-Rookie team honor while on their roster. Consequently, the platform assigns him to the Orlando Magic for his rookie year, as that is the team associated with his performance accolade.</li>
                  </ul>

                  <p><strong className="text-white">How are player positions assigned? Welcome to the Positionless Era with Unicorns.</strong></p>
                  <p>
                    Basketball has evolved, and our draft engine isn't stuck in the past. To give you maximum versatility when building your rotation, the backend evaluates player positional eligibility using a <strong className="text-white">Multi-Season Eligibility System</strong>.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-white">The Math:</strong> The database scans a player's entire historical game log. If a player has logged at least <strong className="text-white">two full seasons</strong> at a specific position (PG, SG, SF, PF, or C), they permanently unlock that position as a legal slot destination.
                    </li>
                    <li>
                      <strong className="text-white">The "KAT" Rule & Positional Peak Scoring:</strong> Take Karl-Anthony Towns, for example. Historically, his primary volume is at Center (C). However, because he has logged two or more seasons playing Power Forward (PF) alongside Rudy Gobert, the engine unlocks Power Forward as a fully legal secondary position for him. 
                      <p className="mt-1 text-slate-400 italic">
                        *Note on Scoring: When you draft KAT into a Forward slot, the Auto-Peak engine strictly filters for his best single season <strong className="text-white">logged at Power Forward</strong>. To get his massive Center peak scores, you must draft him into a Center slot!
                      </p>
                    </li>
                    <li>
                      <strong className="text-white">The Takeaway:</strong> Versatility is rewarded, but you must know your personnel. You can slide multi-positional wings into guard spots or play big-man twin towers, but make sure your player actually logged real minutes at that spot, or the league office will reject the draft pick with a <strong className="text-red-400">-5 point penalty</strong>!
                    </li>
                  </ul>

                  <h4 className="text-blue-400 font-bold uppercase tracking-widest mt-6 mb-2">The Pick Grading System & Position Slots</h4>
                  
                  <p><strong className="text-white">The Pick Grading System: Chasing Perfection</strong></p>
                  <p>Every time you lock in a player, the engine instantly calculates the absolute highest-scoring optimal answer for that exact slot. Your selected player receives a letter grade based on how close their 8MPR score is to the prompt's ultimate ceiling.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">A+ to A- (85% - 100% of Max Score):</strong> A1 from Day 1, your GM skills hit a home run pick.</li>
                    <li><strong className="text-white">B+ to B- (55% - 84% of Max Score):</strong> You're not getting fired, but it's also not something to put on the resume. Solid rotational piece that fits the criteria, but you left some serious points on the board.</li>
                    <li><strong className="text-white">C+ to D- (5% - 54% of Max Score):</strong> You found a guy who technically works, but he's at best a 10th man on the bench.</li>
                    <li><strong className="text-white">F (&lt; 5% of Max Score):</strong> This dude is going to be out of the league soon, and your GM job might be also.</li>
                  </ul>

                  <p className="mt-4"><strong className="text-white">Understanding Position Slots: Building a Modern Roster</strong></p>
                  <p>Our draft board reflects the versatile, positionless nature of modern basketball. Instead of rigidly forcing you into traditional 1-through-5 spots, you will draft into flexible groupings:</p>
                  <ul className="list-disc pl-5 space-y-2 mb-2">
                    <li><strong className="text-white">G (Guard):</strong> Open to Point Guards and Shooting Guards.</li>
                    <li><strong className="text-white">G/F (Wings):</strong> Open to Shooting Guards and Small Forwards.</li>
                    <li><strong className="text-white">F (Forward):</strong> Open to Small Forwards and Power Forwards.</li>
                    <li><strong className="text-white">F/C (Frontcourt):</strong> A unique flex spot, open to Small Forwards, Power Forwards, and Centers.</li>
                    <li><strong className="text-white">C/F (Center or PF):</strong> Open to Centers and Power Forwards.</li>
                  </ul>
                  
                  <p className="text-slate-400 italic">
                    Remember the "KAT Rule": Even within these broad groupings, your drafted player must be eligible for at least one of the specific positions inside that grouping to be a valid pick!
                  </p>

                  <h4 className="text-blue-400 font-bold uppercase tracking-widest mt-6 mb-2">Advanced Strategy & Penalties</h4>

                  <p><strong className="text-white">1. Synchronized Season-Level Validation (Strict Era Peak)</strong></p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">The Rule:</strong> The engine checks team, position, and decade <strong className="text-white">simultaneously on a season-by-season basis.</strong></li>
                    <li><strong className="text-white">How It Works:</strong> If a question asks for a <em>"Dallas Mavericks Guard in the 1990s"</em>, the Auto-Peak engine evaluates Steve Nash's game log and <strong className="text-white">only</strong> considers his actual 1990s Dallas campaigns (1998&ndash;2000). It cannot grab his higher-scoring 2000s All-Star seasons, ensuring player scores remain strictly tied to the requested timeline.</li>
                  </ul>

                  <p><strong className="text-white">Penalty Logic & The "Golf Rule" Loophole</strong></p>
                  <p>We want to keep the draft moving, so we have implemented a user-friendly safeguard for when a slot proves too difficult.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-white">Attempts:</strong> You have infinite attempts to successfully fill a slot.</li>
                    <li><strong className="text-white">The Loophole:</strong> But if you hit -30 points in penalties without successfully filling the slot, you can click <strong className="text-white">Skip</strong>. Think of this as taking a "max penalty" in golf&mdash;much like failing to get your ball in the hole after a set number of strokes, the skip allows you to generate a flat -25 point penalty and move on to the next pick. Or keep guessing to get points on the board against the penalties of previous wrong answers&mdash;totally up to you. Again: this is the 'Player-Empowerment Era'.</li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => setShowPlaybook(false)}
                  className="mt-2 relative z-30 font-sans font-black uppercase text-sm sm:text-base tracking-widest text-[#10152b] bg-gradient-to-b from-[#ffb75e] to-[#ed8f03] w-full py-3.5 sm:py-4 rounded-xl border-b-[4px] border-[#c07402] hover:translate-y-[2px] hover:border-b-[2px] active:translate-y-[4px] active:border-b-0 transition-all flex justify-center items-center gap-2 shadow-[0_0_25px_rgba(237,143,3,0.3)]"
                >
                  Close Playbook
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
