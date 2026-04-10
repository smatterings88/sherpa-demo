export type DemoScenario =
  | "PRICE_OBJECTION"
  | "SEND_ME_INFO"
  | "COMPETITOR_OBJECTION";

export type ScriptLineRole =
  | "narrator"
  | "prospect"
  | "rep_bad"
  | "alex"
  | "rep_good";

export interface ScriptLine {
  role: ScriptLineRole;
  text: string;
}

export interface DemoScript {
  scenario: DemoScenario;
  lines: ScriptLine[];
}

export interface AudioSegment {
  role: ScriptLineRole;
  mimeType: "audio/mpeg";
  base64: string;
}

export interface RemoteAudioSegment {
  role: ScriptLineRole;
  mimeType: "audio/mpeg";
  url: string;
}

export interface DemoLoss {
  commission: number;
  dealSize: number;
  annualLoss: number;
}

export type GenerateDemoSuccessResponse =
  | {
      success: true;
      scenario: DemoScenario;
      pain: string;
      audioMode: "single";
      audioUrl: string;
      loss: DemoLoss;
    }
  | {
      success: true;
      scenario: DemoScenario;
      pain: string;
      audioMode: "segments";
      segments: AudioSegment[];
      loss: DemoLoss;
    }
  | {
      success: true;
      scenario: DemoScenario;
      pain: string;
      audioMode: "segment_urls";
      segmentUrls: RemoteAudioSegment[];
      loss: DemoLoss;
    };

export interface GenerateDemoErrorResponse {
  success: false;
  error: string;
  code?: "VALIDATION" | "CONFIG" | "LLM" | "TTS" | "UNKNOWN";
}

export type GenerateDemoResponse =
  | GenerateDemoSuccessResponse
  | GenerateDemoErrorResponse;
