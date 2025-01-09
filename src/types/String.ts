export { };

declare global {

    interface String {
        /**
         * Truncates this string to the specified maximum length.
         *
         * If this string is shorter than or equal to `maxLength`, then this
         * string is returned.
         *
         * @param maxLength The maximum length of the truncated string.
         *
         * @returns The truncated string.
         */
        truncated(maxLength: number): string;
    }

}
