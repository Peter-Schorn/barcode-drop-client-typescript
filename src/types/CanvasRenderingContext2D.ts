export { };

declare global {
    interface CanvasRenderingContext2D {

        /**
         * Draws a path with the given corners.
         *
         * @param corners The corners of the path.
         */
        drawPathWithCorners(
            corners: {
                x: number;
                y: number;
            }[]
        ): void;
    }
}
