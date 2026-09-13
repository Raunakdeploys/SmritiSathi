export type TimeSenseLevelKey = 1 | 2 | 3 | 4 | 5 | '5.4' | '5.2' | 6 | 7 | 8 | 9 | 10;

export interface TimeSenseTaskConfig {
  levelKey: TimeSenseLevelKey;
  levelDisplay: string;
  title: string;
  subtitle: string;
  pillar:
    | 'Visuospatial'
    | 'Working Memory'
    | 'Auditory Recall'
    | 'Planning & Reasoning'
    | 'Temporal Sequencing'
    | 'Executive Daily Integration';
  targetHour: number;
  targetMinute: number;
  targetPeriod: 'AM' | 'PM';
  missingNumbers: number[];
  showClockNumbers: boolean;
  visualAnchorNumbers?: number[];
  needsNumberPlacement: boolean;
  hasAudioOnlyPrompt: boolean;
  spokenAudioText?: string;
  hasPreInspectionCountdown?: number;
  inspectionTarget?: { hour: number; minute: number; text: string };
  reasoningStory?: {
    promptText: string;
    subtext: string;
    calculatedSolutionExplanation: string;
  };
  scheduleEvents?: {
    id: string;
    time: string;
    hourNum: number;
    title: string;
    icon: string;
    order: number;
  }[];
  scheduleQuestion?: {
    questionText: string;
    correctAnswerId: string;
    options: { id: string; label: string }[];
    explanation: string;
  };
  preGameHint?: string;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const NUMBER_WORDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
};

/**
 * Generates a randomized challenge configuration for the requested level
 */
export function generateRandomLevelConfig(
  levelKey: TimeSenseLevelKey,
  seed?: number
): TimeSenseTaskConfig {
  const keyStr = String(levelKey);

  switch (keyStr) {
    case '1': {
      // Level 1: Direct O'Clock Setting
      const randomHours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const targetHour = getRandomElement(randomHours);
      const targetPeriod = targetHour >= 7 && targetHour <= 11 ? 'AM' : 'PM';
      const hourWord = NUMBER_WORDS[targetHour] || String(targetHour);

      return {
        levelKey: 1,
        levelDisplay: 'Level 1',
        title: 'Direct Time Setting',
        subtitle: `Standard clock face provided. Set the clock to ${targetHour}:00.`,
        pillar: 'Visuospatial',
        targetHour,
        targetMinute: 0,
        targetPeriod,
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        spokenAudioText: `Set the clock to ${hourWord} o'clock.`,
        reasoningStory: {
          promptText: `Set the clock to ${targetHour}:00 (${hourWord} o'clock).`,
          subtext: `Position the short hour hand pointing directly at ${targetHour} and the long minute hand straight up at 12 (0 minutes).`,
          calculatedSolutionExplanation: `${targetHour}:00 has the hour hand pointing at ${targetHour} and the minute hand at 12 (0 minutes).`,
        },
      };
    }

    case '2': {
      // Level 2: Half-Past Alignment (30 minutes)
      const randomHours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const targetHour = getRandomElement(randomHours);
      const targetPeriod = targetHour >= 7 && targetHour <= 11 ? 'AM' : 'PM';
      const hourWord = NUMBER_WORDS[targetHour] || String(targetHour);

      return {
        levelKey: 2,
        levelDisplay: 'Level 2',
        title: 'Half-Past Alignment',
        subtitle: `Set the hands to ${targetHour}:30 (Half past ${targetHour}).`,
        pillar: 'Visuospatial',
        targetHour,
        targetMinute: 30,
        targetPeriod,
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        spokenAudioText: `Set the clock to half past ${hourWord}.`,
        reasoningStory: {
          promptText: `Set the clock to ${targetHour}:30 (Half past ${targetHour}).`,
          subtext: `Place the hour hand midway past ${targetHour} and the long minute hand pointing straight down at 6 (30 minutes).`,
          calculatedSolutionExplanation: `${targetHour}:30 aligns the minute hand with 6 (30 min) and hour hand between ${targetHour} and ${(targetHour % 12) + 1}.`,
        },
      };
    }

    case '3': {
      // Level 3: Quarter-Past or Quarter-To Spatial Setting (15m or 45m)
      const targetHour = getRandomElement([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const targetMinute = getRandomElement([15, 45]);
      const targetPeriod = targetHour >= 7 && targetHour <= 11 ? 'AM' : 'PM';
      const hourWord = NUMBER_WORDS[targetHour] || String(targetHour);
      const nextHour = (targetHour % 12) + 1;
      const nextHourWord = NUMBER_WORDS[nextHour] || String(nextHour);

      const phrase =
        targetMinute === 15
          ? `Quarter past ${hourWord} (${targetHour}:15)`
          : `Quarter to ${nextHourWord} (${targetHour}:45)`;

      return {
        levelKey: 3,
        levelDisplay: 'Level 3',
        title: targetMinute === 15 ? 'Quarter-Past Spatial Setting' : 'Quarter-To Spatial Setting',
        subtitle: `Set the clock hands to ${phrase}.`,
        pillar: 'Visuospatial',
        targetHour,
        targetMinute,
        targetPeriod,
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        spokenAudioText: `Set the clock to ${phrase}.`,
        reasoningStory: {
          promptText: `Set the clock to ${targetHour}:${targetMinute} (${phrase}).`,
          subtext:
            targetMinute === 15
              ? `Point the long minute hand to 3 (15 min) and hour hand near ${targetHour}.`
              : `Point the long minute hand to 9 (45 min) and hour hand moving toward ${nextHour}.`,
          calculatedSolutionExplanation: `${targetHour}:${targetMinute} places the minute hand at ${
            targetMinute === 15 ? '3' : '9'
          } and hour hand at ${targetHour}.`,
        },
      };
    }

    case '4': {
      // Level 4: Cardinal Anchor Construction (12, 3, 6, 9 missing)
      const targetHour = getRandomElement([1, 2, 4, 5, 7, 8, 10, 11]);
      const targetMinute = getRandomElement([10, 20, 25, 35, 40, 50]);
      const targetPeriod = 'PM';

      return {
        levelKey: 4,
        levelDisplay: 'Level 4',
        title: 'Cardinal Anchor Construction',
        subtitle: `Blank clock face: First place 12, 3, 6, 9 anchors, then set ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
        pillar: 'Visuospatial',
        targetHour,
        targetMinute,
        targetPeriod,
        missingNumbers: [12, 3, 6, 9],
        showClockNumbers: false,
        needsNumberPlacement: true,
        hasAudioOnlyPrompt: false,
        spokenAudioText: `First place cardinal numbers 12, 3, 6, 9 into their positions, then set ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
        reasoningStory: {
          promptText: `First place cardinal anchors (12, 3, 6, 9) into their slots, then set ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
          subtext: '12 is at the top, 6 at the bottom, 3 on the right, and 9 on the left.',
          calculatedSolutionExplanation: `Anchor points frame spatial orientation before positioning hands at ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
        },
      };
    }

    case '5': {
      // Level 5: Full Dial Construction (all 12 digits missing)
      const targetHour = getRandomElement([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]);
      const targetMinute = getRandomElement([5, 10, 20, 25, 35, 40, 50, 55]);
      const targetPeriod = 'AM';

      return {
        levelKey: 5,
        levelDisplay: 'Level 5',
        title: 'Full Dial Construction',
        subtitle: `Position all 12 dial numbers and set the hands to ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
        pillar: 'Visuospatial',
        targetHour,
        targetMinute,
        targetPeriod,
        missingNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        showClockNumbers: false,
        needsNumberPlacement: true,
        hasAudioOnlyPrompt: false,
        spokenAudioText: `Position all clock numbers from 1 to 12 accurately, then adjust hands to ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
        reasoningStory: {
          promptText: `Position all clock numbers (1 to 12) accurately, then adjust hands to ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
          subtext: 'Spatial layout tests mental rotation, perimeter mapping, and hand alignment.',
          calculatedSolutionExplanation: `All 12 digits must be distributed clockwise around the dial circumference to read ${targetHour}:${targetMinute.toString().padStart(2, '0')}.`,
        },
      };
    }

    case '5.4': {
      // Bridge Level 5.4: Supported Visual Memory Bridge
      const targetHour = getRandomElement([3, 4, 7, 9]);
      const targetMinute = getRandomElement([15, 30, 35, 45]);
      const formatted = `${targetHour}:${targetMinute.toString().padStart(2, '0')}`;

      return {
        levelKey: '5.4',
        levelDisplay: 'Bridge Challenge 5.4',
        title: 'Supported Visual Memory Bridge',
        subtitle: `10s memorization with 12, 3, 6, 9 anchors retained for scaffolded support.`,
        pillar: 'Working Memory',
        targetHour,
        targetMinute,
        targetPeriod: 'PM',
        missingNumbers: [],
        showClockNumbers: true,
        visualAnchorNumbers: [12, 3, 6, 9],
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        hasPreInspectionCountdown: 10,
        inspectionTarget: { hour: targetHour, minute: targetMinute, text: `${formatted} PM` },
        preGameHint: `💡 Bridge Hint: Note the hour hand near ${targetHour} and minute hand at ${targetMinute} min.`,
        reasoningStory: {
          promptText: `Memorize the clock face (10 seconds), then reconstruct ${formatted} from working memory.`,
          subtext: 'Scaffolded bridge level providing visual anchor digits to support memory transition.',
          calculatedSolutionExplanation: 'Retaining cardinal anchors helps reinforce spatial orientation during working memory recall.',
        },
      };
    }

    case '5.2': {
      // Bridge Level 5.2: Guided Temporal Recall
      const targetHour = getRandomElement([2, 5, 8, 10]);
      const targetMinute = getRandomElement([0, 30]);
      const formatted = `${targetHour}:${targetMinute.toString().padStart(2, '0')}`;

      return {
        levelKey: '5.2',
        levelDisplay: 'Bridge Challenge 5.2',
        title: 'Guided Temporal Recall',
        subtitle: `Step-by-step assisted recall with direct hand prompts.`,
        pillar: 'Working Memory',
        targetHour,
        targetMinute,
        targetPeriod: 'PM',
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        hasPreInspectionCountdown: 10,
        inspectionTarget: { hour: targetHour, minute: targetMinute, text: `${formatted} PM` },
        preGameHint: `💡 Bridge Hint: Hour hand is at ${targetHour}, minute hand points to ${targetMinute === 0 ? '12 (0 min)' : '6 (30 min)'}.`,
        reasoningStory: {
          promptText: `Memorize ${formatted} PM, then set the clock hands.`,
          subtext: 'Gentle scaffolded challenge focused purely on hand orientation.',
          calculatedSolutionExplanation: 'Working memory practice with gentle visual reinforcement.',
        },
      };
    }

    case '6': {
      // Level 6: Visual Working Memory Recall (5s inspection countdown)
      const targetHour = getRandomElement([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const targetMinute = getRandomElement([5, 15, 20, 25, 35, 40, 45, 50, 55]);
      const formatted = `${targetHour}:${targetMinute.toString().padStart(2, '0')}`;

      return {
        levelKey: 6,
        levelDisplay: 'Level 6',
        title: 'Visual Working Memory Recall',
        subtitle: `Clock is shown for 5 seconds → vanishes → reconstruct the exact time.`,
        pillar: 'Working Memory',
        targetHour,
        targetMinute,
        targetPeriod: 'PM',
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        hasPreInspectionCountdown: 5,
        inspectionTarget: { hour: targetHour, minute: targetMinute, text: formatted },
        spokenAudioText: 'Study the clock closely for five seconds! Recreate the exact time once it disappears.',
        reasoningStory: {
          promptText: `Study the clock closely for 5 seconds! Recreate the exact time (${formatted}) once it disappears.`,
          subtext: 'Visual & working memory integration.',
          calculatedSolutionExplanation: `Rebuilding visual memory of ${formatted} into motor hand positioning.`,
        },
      };
    }

    case '7': {
      // Level 7: Auditory Comprehension & Working Memory (Spoken phrase only)
      const audioScenarios = [
        { phrase: 'twenty minutes past seven', h: 7, m: 20 },
        { phrase: 'quarter to four', h: 3, m: 45 },
        { phrase: 'ten minutes past ten', h: 10, m: 10 },
        { phrase: 'twenty-five minutes past eight', h: 8, m: 25 },
        { phrase: 'five minutes to two', h: 1, m: 55 },
        { phrase: 'half past nine', h: 9, m: 30 },
        { phrase: 'quarter past five', h: 5, m: 15 },
        { phrase: 'twenty minutes to six', h: 5, m: 40 },
        { phrase: 'ten minutes to eleven', h: 10, m: 50 },
        { phrase: 'thirty-five minutes past three', h: 3, m: 35 },
        { phrase: 'five minutes past one', h: 1, m: 5 },
        { phrase: 'forty minutes past twelve', h: 12, m: 40 },
      ];

      const selected = getRandomElement(audioScenarios);

      return {
        levelKey: 7,
        levelDisplay: 'Level 7',
        title: 'Auditory Comprehension & Working Memory',
        subtitle: 'Voice prompt only: Listen carefully to the spoken time phrase.',
        pillar: 'Auditory Recall',
        targetHour: selected.h,
        targetMinute: selected.m,
        targetPeriod: 'AM',
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: true,
        spokenAudioText: `Set the clock to ${selected.phrase}.`,
        reasoningStory: {
          promptText: `“Set the clock to ${selected.phrase}.”`,
          subtext: 'No written time digits provided. Listen to the spoken voice prompt and set the hands.',
          calculatedSolutionExplanation: `“${selected.phrase}” translates to ${selected.h}:${selected.m.toString().padStart(2, '0')}.`,
        },
      };
    }

    case '8': {
      // Level 8: Everyday Planning & Temporal Reasoning
      const scenarios = [
        {
          story: 'Your doctor appointment is at 4:30 PM. It takes 30 minutes to travel there. Show when you should leave your house.',
          spoken: 'Your doctor appointment is at 4:30. It takes 30 minutes to travel there. Show when you should leave your house.',
          targetH: 4,
          targetM: 0,
          explanation: '4:30 PM minus 30 minutes travel time = 4:00 PM departure time.',
        },
        {
          story: 'A dear friend is visiting for afternoon tea at 3:15 PM. Freshly baking warm scones takes 45 minutes. When should you put them in the oven?',
          spoken: 'A dear friend is visiting for tea at 3:15. Baking scones takes 45 minutes. When should you start baking?',
          targetH: 2,
          targetM: 30,
          explanation: '3:15 PM minus 45 minutes baking time = 2:30 PM start time.',
        },
        {
          story: 'The evening community concert starts at 7:00 PM. Driving and finding parking takes 40 minutes. When should you leave your home?',
          spoken: 'The evening concert starts at 7:00. Driving and parking takes 40 minutes. When should you leave your home?',
          targetH: 6,
          targetM: 20,
          explanation: '7:00 PM minus 40 minutes travel time = 6:20 PM departure time.',
        },
        {
          story: 'You took your morning medicine at 8:00 AM. Your doctor advises waiting 45 minutes before having breakfast. When should you have breakfast?',
          spoken: 'You took your medicine at 8:00 AM. You must wait 45 minutes before breakfast. When should you have breakfast?',
          targetH: 8,
          targetM: 45,
          explanation: '8:00 AM plus 45 minutes waiting period = 8:45 AM breakfast time.',
        },
        {
          story: 'Your favorite nature documentary airs on television at 8:30 PM. You want to finish a 50-minute dinner right before it starts. When should you sit down for dinner?',
          spoken: 'The documentary starts at 8:30 PM. You want to finish a 50-minute dinner right before it starts. When should you begin dinner?',
          targetH: 7,
          targetM: 40,
          explanation: '8:30 PM minus 50 minutes dinner time = 7:40 PM dinner start.',
        },
        {
          story: 'Your family video call is scheduled for 5:15 PM. Your afternoon walk in the park takes 35 minutes. When should you start your walk to be back in time?',
          spoken: 'Your family video call is at 5:15. Your park walk takes 35 minutes. When should you begin your walk?',
          targetH: 4,
          targetM: 40,
          explanation: '5:15 PM minus 35 minutes walk = 4:40 PM walk departure.',
        },
        {
          story: 'Lunch with your neighbor is at 1:00 PM. A pleasant stroll to the cafe takes 25 minutes. When should you step out the door?',
          spoken: 'Lunch with your neighbor is at 1:00 PM. The stroll to the cafe takes 25 minutes. When should you step out?',
          targetH: 12,
          targetM: 35,
          explanation: '1:00 PM minus 25 minutes = 12:35 PM departure time.',
        },
      ];

      const selected = getRandomElement(scenarios);

      return {
        levelKey: 8,
        levelDisplay: 'Level 8',
        title: 'Everyday Planning & Temporal Reasoning',
        subtitle: 'Practical schedule calculation & departure time setting.',
        pillar: 'Planning & Reasoning',
        targetHour: selected.targetH,
        targetMinute: selected.targetM,
        targetPeriod: 'PM',
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        spokenAudioText: selected.spoken,
        reasoningStory: {
          promptText: selected.story,
          subtext: 'Executive function & backward time planning.',
          calculatedSolutionExplanation: selected.explanation,
        },
      };
    }

    case '9': {
      // Level 9: Temporal & Episodic Sequencing
      const routinePools = [
        {
          events: [
            { id: 'ev1', time: '8:00 AM', hourNum: 8, title: 'Warm Breakfast & Tea', icon: 'restaurant', order: 1 },
            { id: 'ev2', time: '9:30 AM', hourNum: 9.5, title: 'Garden Stroll Walk', icon: 'park', order: 2 },
            { id: 'ev3', time: '11:00 AM', hourNum: 11, title: 'Family Video Call', icon: 'call', order: 3 },
          ],
          targetH: 9,
          targetM: 30,
          targetPeriod: 'AM' as const,
          question: {
            questionText: 'What scheduled event happened right BEFORE the Garden Stroll Walk?',
            correctAnswerId: 'ev1',
            options: [
              { id: 'ev1', label: 'Warm Breakfast & Tea (8:00 AM)' },
              { id: 'ev3', label: 'Family Video Call (11:00 AM)' },
              { id: 'ev_other', label: 'Afternoon Nap (2:00 PM)' },
            ],
            explanation: 'Breakfast occurred at 8:00 AM, right before the 9:30 AM garden walk.',
          },
          story: 'Study the three scheduled morning events. Once memorized, set the clock to the Garden Walk (9:30 AM) and identify which event came before it.',
        },
        {
          events: [
            { id: 'ev1', time: '12:30 PM', hourNum: 12.5, title: 'Nutritious Lunch & Soup', icon: 'restaurant', order: 1 },
            { id: 'ev2', time: '2:15 PM', hourNum: 14.25, title: 'Book Club Reading', icon: 'menu_book', order: 2 },
            { id: 'ev3', time: '4:00 PM', hourNum: 16, title: 'Gentle Chair Yoga', icon: 'self_improvement', order: 3 },
          ],
          targetH: 2,
          targetM: 15,
          targetPeriod: 'PM' as const,
          question: {
            questionText: 'What event is scheduled right AFTER the Book Club Reading?',
            correctAnswerId: 'ev3',
            options: [
              { id: 'ev3', label: 'Gentle Chair Yoga (4:00 PM)' },
              { id: 'ev1', label: 'Nutritious Lunch & Soup (12:30 PM)' },
              { id: 'ev_other', label: 'Morning Medication (8:00 AM)' },
            ],
            explanation: 'Gentle Chair Yoga at 4:00 PM occurs immediately following Book Club Reading at 2:15 PM.',
          },
          story: 'Study the afternoon schedule. Set the clock to Book Club Reading (2:15 PM) and recall what activity follows it.',
        },
        {
          events: [
            { id: 'ev1', time: '7:45 AM', hourNum: 7.75, title: 'Brisk Morning Walk', icon: 'directions_walk', order: 1 },
            { id: 'ev2', time: '10:15 AM', hourNum: 10.25, title: 'Pharmacy Prescription Pickup', icon: 'local_pharmacy', order: 2 },
            { id: 'ev3', time: '1:30 PM', hourNum: 13.5, title: 'Relaxing Music Session', icon: 'music_note', order: 3 },
          ],
          targetH: 10,
          targetM: 15,
          targetPeriod: 'AM' as const,
          question: {
            questionText: 'Which activity was the EARLIEST scheduled event of the day?',
            correctAnswerId: 'ev1',
            options: [
              { id: 'ev1', label: 'Brisk Morning Walk (7:45 AM)' },
              { id: 'ev2', label: 'Pharmacy Prescription Pickup (10:15 AM)' },
              { id: 'ev3', label: 'Relaxing Music Session (1:30 PM)' },
            ],
            explanation: 'The morning walk at 7:45 AM is the earliest event.',
          },
          story: 'Review the day timeline. Set the clock to the Pharmacy Pickup (10:15 AM) and select the earliest daily event.',
        },
      ];

      const selected = getRandomElement(routinePools);

      return {
        levelKey: 9,
        levelDisplay: 'Level 9',
        title: 'Temporal & Episodic Sequencing',
        subtitle: 'Memorize the 3 daily events schedule, then reconstruct the timeline order.',
        pillar: 'Temporal Sequencing',
        targetHour: selected.targetH,
        targetMinute: selected.targetM,
        targetPeriod: selected.targetPeriod,
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        hasPreInspectionCountdown: 6,
        scheduleEvents: selected.events,
        scheduleQuestion: selected.question,
        spokenAudioText: 'Study the three scheduled events. Reconstruct the timeline and set the clock.',
        reasoningStory: {
          promptText: selected.story,
          subtext: 'Temporal and episodic memory ordering.',
          calculatedSolutionExplanation: selected.question.explanation,
        },
      };
    }

    case '10': {
      // Level 10: Executive Daily Schedule Integration
      const dailySchedules = [
        {
          events: [
            { id: 'd1', time: '9:00 AM', hourNum: 9, title: 'Morning Medicine & Hydration', icon: 'medication', order: 1 },
            { id: 'd2', time: '12:30 PM', hourNum: 12.5, title: 'Healthy Lunch', icon: 'restaurant', order: 2 },
            { id: 'd3', time: '2:15 PM', hourNum: 14.25, title: 'Doctor Visit & Checkup', icon: 'local_hospital', order: 3 },
            { id: 'd4', time: '6:00 PM', hourNum: 18, title: 'Evening Walk & Tea', icon: 'park', order: 4 },
          ],
          targetH: 2,
          targetM: 15,
          targetPeriod: 'PM' as const,
          question: {
            questionText: 'The doctor visit takes 45 minutes. If it starts at 2:15 PM, what time will it conclude (3:00 PM)? Confirm the scheduled start.',
            correctAnswerId: 'd3',
            options: [
              { id: 'd3', label: 'Doctor Visit starts at 2:15 PM (Ends 3:00 PM)' },
              { id: 'd2', label: 'Healthy Lunch at 12:30 PM' },
              { id: 'd4', label: 'Evening Walk at 6:00 PM' },
            ],
            explanation: 'Doctor visit starts at 2:15 PM. Adding 45 minutes brings the time to 3:00 PM.',
          },
          story: 'Set the clock to 2:15 PM for the Doctor Visit checkup, and confirm the duration calculation.',
        },
        {
          events: [
            { id: 'd1', time: '8:30 AM', hourNum: 8.5, title: 'Breakfast & Multivitamins', icon: 'restaurant', order: 1 },
            { id: 'd2', time: '11:00 AM', hourNum: 11, title: 'Library Book Return', icon: 'local_library', order: 2 },
            { id: 'd3', time: '3:45 PM', hourNum: 15.75, title: 'Community Center Gardening', icon: 'yard', order: 3 },
            { id: 'd4', time: '7:15 PM', hourNum: 19.25, title: 'Dinner with Family', icon: 'family_restroom', order: 4 },
          ],
          targetH: 3,
          targetM: 45,
          targetPeriod: 'PM' as const,
          question: {
            questionText: 'Gardening starts at 3:45 PM and lasts 1 hour and 15 minutes. What time does it end (5:00 PM)? Confirm the event.',
            correctAnswerId: 'd3',
            options: [
              { id: 'd3', label: 'Gardening at 3:45 PM (Ends 5:00 PM)' },
              { id: 'd2', label: 'Library Return at 11:00 AM' },
              { id: 'd4', label: 'Family Dinner at 7:15 PM' },
            ],
            explanation: '3:45 PM plus 1h 15m duration equals 5:00 PM.',
          },
          story: 'Set the clock to 3:45 PM for Community Center Gardening and calculate the completion time.',
        },
      ];

      const selected = getRandomElement(dailySchedules);

      return {
        levelKey: 10,
        levelDisplay: 'Level 10',
        title: 'Executive Daily Schedule Challenge',
        subtitle: 'Integrated multi-component: Clock setting + event ordering + temporal arithmetic.',
        pillar: 'Executive Daily Integration',
        targetHour: selected.targetH,
        targetMinute: selected.targetM,
        targetPeriod: selected.targetPeriod,
        missingNumbers: [],
        showClockNumbers: true,
        needsNumberPlacement: false,
        hasAudioOnlyPrompt: false,
        hasPreInspectionCountdown: 5,
        scheduleEvents: selected.events,
        scheduleQuestion: selected.question,
        spokenAudioText: selected.story,
        reasoningStory: {
          promptText: selected.story,
          subtext: 'Executive multi-component synthesis for daily life independence.',
          calculatedSolutionExplanation: selected.question.explanation,
        },
      };
    }

    default:
      return generateRandomLevelConfig(1);
  }
}
