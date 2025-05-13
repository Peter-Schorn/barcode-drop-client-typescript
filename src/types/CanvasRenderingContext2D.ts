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

        /**
         * Rotates the canvas context by the given angle around the specified
         * point.
         *
         * @param angle The angle in radians.
         * @param x The x-coordinate of the point to rotate around.
         * @param y The y-coordinate of the point to rotate around.
         */
        rotateAboutPoint(
            angle: number,
            x: number,
            y: number
        ) : void;

        /**
         * Rotates the canvas context by the given angle around the center of
         * the canvas.
         *
         * @param angle The angle in radians.
         */
        rotateAboutCenter(
            angle: number
        ) : void;
    }
}
