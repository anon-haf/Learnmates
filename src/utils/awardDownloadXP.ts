export type DownloadResourceType = 'file' | 'paper' | 'topical_paper';

export {
  commitDownloadAward,
  commitDownloadAward as awardDownloadXP,
  downloadFileWithXP,
  downloadFileWithXPOrDirect,
} from './downloadWithXP';

export {
  logDownload,
  formatResourceUrl,
  formatPaperOrTopicalUrl,
  normalizePaperOrTopicalUrl,
  type DownloadAction,
  type LogDownloadParams,
} from './downloadLogger';
