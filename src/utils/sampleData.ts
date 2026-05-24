export interface SleepSample {
    id: string;
    eye_aspect_ratio: number;
    blink_rate_per_min: number;
    yawning_frequency: number;
    face_fatigue_level: string;
    sleep_hours: number;
    sleep_quality: string;
    is_deprived: boolean;
}

export const SLEEP_SAMPLES: SleepSample[] = [
    { id: "S-01", eye_aspect_ratio: 0.21, blink_rate_per_min: 14, yawning_frequency: 3, face_fatigue_level: "Low", sleep_hours: 5.8, sleep_quality: "Average", is_deprived: false },
    { id: "S-02", eye_aspect_ratio: 0.3, blink_rate_per_min: 13, yawning_frequency: 0, face_fatigue_level: "Low", sleep_hours: 7.7, sleep_quality: "Good", is_deprived: false },
    { id: "S-03", eye_aspect_ratio: 0.34, blink_rate_per_min: 13, yawning_frequency: 3, face_fatigue_level: "Low", sleep_hours: 3.7, sleep_quality: "Poor", is_deprived: true },
    { id: "S-04", eye_aspect_ratio: 0.18, blink_rate_per_min: 12, yawning_frequency: 6, face_fatigue_level: "High", sleep_hours: 6.3, sleep_quality: "Average", is_deprived: true },
    { id: "S-05", eye_aspect_ratio: 0.29, blink_rate_per_min: 18, yawning_frequency: 2, face_fatigue_level: "Low", sleep_hours: 4.5, sleep_quality: "Poor", is_deprived: true },
    { id: "S-06", eye_aspect_ratio: 0.32, blink_rate_per_min: 30, yawning_frequency: 4, face_fatigue_level: "High", sleep_hours: 5.3, sleep_quality: "Average", is_deprived: true },
    { id: "S-07", eye_aspect_ratio: 0.18, blink_rate_per_min: 21, yawning_frequency: 0, face_fatigue_level: "Medium", sleep_hours: 7.4, sleep_quality: "Good", is_deprived: true },
    { id: "S-08", eye_aspect_ratio: 0.21, blink_rate_per_min: 34, yawning_frequency: 4, face_fatigue_level: "High", sleep_hours: 3.7, sleep_quality: "Poor", is_deprived: true },
    { id: "S-09", eye_aspect_ratio: 0.26, blink_rate_per_min: 29, yawning_frequency: 2, face_fatigue_level: "High", sleep_hours: 7.6, sleep_quality: "Good", is_deprived: false },
    { id: "S-10", eye_aspect_ratio: 0.35, blink_rate_per_min: 21, yawning_frequency: 3, face_fatigue_level: "Medium", sleep_hours: 6.9, sleep_quality: "Average", is_deprived: false },
    { id: "S-11", eye_aspect_ratio: 0.18, blink_rate_per_min: 33, yawning_frequency: 3, face_fatigue_level: "High", sleep_hours: 7.4, sleep_quality: "Good", is_deprived: false },
    { id: "S-12", eye_aspect_ratio: 0.33, blink_rate_per_min: 19, yawning_frequency: 3, face_fatigue_level: "Medium", sleep_hours: 7.9, sleep_quality: "Good", is_deprived: true },
    { id: "S-13", eye_aspect_ratio: 0.3, blink_rate_per_min: 39, yawning_frequency: 1, face_fatigue_level: "High", sleep_hours: 6.3, sleep_quality: "Average", is_deprived: true },
    { id: "S-14", eye_aspect_ratio: 0.24, blink_rate_per_min: 37, yawning_frequency: 3, face_fatigue_level: "High", sleep_hours: 6.6, sleep_quality: "Average", is_deprived: true },
    { id: "S-15", eye_aspect_ratio: 0.33, blink_rate_per_min: 40, yawning_frequency: 1, face_fatigue_level: "High", sleep_hours: 3.9, sleep_quality: "Poor", is_deprived: true },
    { id: "S-16", eye_aspect_ratio: 0.21, blink_rate_per_min: 39, yawning_frequency: 4, face_fatigue_level: "High", sleep_hours: 6.2, sleep_quality: "Average", is_deprived: false },
    { id: "S-17", eye_aspect_ratio: 0.24, blink_rate_per_min: 39, yawning_frequency: 1, face_fatigue_level: "High", sleep_hours: 3.8, sleep_quality: "Poor", is_deprived: true },
    { id: "S-18", eye_aspect_ratio: 0.2, blink_rate_per_min: 13, yawning_frequency: 6, face_fatigue_level: "High", sleep_hours: 4.8, sleep_quality: "Poor", is_deprived: true },
    { id: "S-19", eye_aspect_ratio: 0.22, blink_rate_per_min: 24, yawning_frequency: 5, face_fatigue_level: "High", sleep_hours: 6, sleep_quality: "Average", is_deprived: false },
    { id: "S-20", eye_aspect_ratio: 0.32, blink_rate_per_min: 24, yawning_frequency: 6, face_fatigue_level: "High", sleep_hours: 5.1, sleep_quality: "Average", is_deprived: false },
    { id: "S-21", eye_aspect_ratio: 0.22, blink_rate_per_min: 25, yawning_frequency: 2, face_fatigue_level: "Medium", sleep_hours: 4, sleep_quality: "Poor", is_deprived: true },
    { id: "S-22", eye_aspect_ratio: 0.35, blink_rate_per_min: 26, yawning_frequency: 2, face_fatigue_level: "High", sleep_hours: 5.4, sleep_quality: "Average", is_deprived: true },
    { id: "S-23", eye_aspect_ratio: 0.21, blink_rate_per_min: 29, yawning_frequency: 0, face_fatigue_level: "High", sleep_hours: 4.1, sleep_quality: "Poor", is_deprived: true },
    { id: "S-24", eye_aspect_ratio: 0.2, blink_rate_per_min: 26, yawning_frequency: 3, face_fatigue_level: "High", sleep_hours: 5.5, sleep_quality: "Average", is_deprived: false },
    { id: "S-25", eye_aspect_ratio: 0.32, blink_rate_per_min: 23, yawning_frequency: 4, face_fatigue_level: "High", sleep_hours: 6, sleep_quality: "Average", is_deprived: false },
    { id: "S-26", eye_aspect_ratio: 0.24, blink_rate_per_min: 27, yawning_frequency: 2, face_fatigue_level: "High", sleep_hours: 4.3, sleep_quality: "Poor", is_deprived: true },
    { id: "S-27", eye_aspect_ratio: 0.25, blink_rate_per_min: 16, yawning_frequency: 0, face_fatigue_level: "Low", sleep_hours: 7.4, sleep_quality: "Good", is_deprived: false },
    { id: "S-28", eye_aspect_ratio: 0.27, blink_rate_per_min: 39, yawning_frequency: 1, face_fatigue_level: "High", sleep_hours: 6.2, sleep_quality: "Average", is_deprived: true },
    { id: "S-29", eye_aspect_ratio: 0.34, blink_rate_per_min: 13, yawning_frequency: 2, face_fatigue_level: "Low", sleep_hours: 5.3, sleep_quality: "Average", is_deprived: true },
    { id: "S-30", eye_aspect_ratio: 0.29, blink_rate_per_min: 10, yawning_frequency: 2, face_fatigue_level: "Low", sleep_hours: 3.6, sleep_quality: "Poor", is_deprived: true }
];
