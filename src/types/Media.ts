export { };


declare global {

    type MediaTrackConstraintMode = |
        "none" |
        "continuous" |
        "single-shot" |
        "manual";

    interface MediaTrackSettings {
        torch: boolean;
    }

    interface MediaTrackCapabilities {
        torch?: boolean;
    }

    interface MediaTrackConstraintSet {
        torch?: boolean;
    }

    interface MediaTrackConstraints {
        torch?: boolean;
        focusMode?: MediaTrackConstraintMode;
        exposureMode?: MediaTrackConstraintMode;
        whiteBalanceMode?: MediaTrackConstraintMode;
    }

}
