export { };


declare global {

    type MediaTrackConstraintMode = |
        "none" |
        "continuous" |
        "single-shot" |
        "manual";

    type MediaTrackCoordinate = {
        x: number;
        y: number;
    };

    interface MediaTrackSettings {
        torch: boolean;
    }

    interface MediaTrackCapabilities {
        torch?: boolean;
        focusMode?: MediaTrackConstraintMode;
    }

    interface MediaTrackConstraintSet {
        torch?: boolean;
        focusMode?: MediaTrackConstraintMode;
        focusDistance?: ConstrainDouble;
        pointOfInterest?: MediaTrackCoordinate | MediaTrackCoordinate[];
        zoom?: ConstrainDouble;
    }

    interface MediaTrackConstraints {
        torch?: boolean;
        focusMode?: MediaTrackConstraintMode;
        exposureMode?: MediaTrackConstraintMode;
        whiteBalanceMode?: MediaTrackConstraintMode;
    }

}
