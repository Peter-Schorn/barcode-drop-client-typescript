export { };

declare global {
    interface KeyboardEvent {
        /**
         * Whether the platform modifier key (Ctrl on Windows/Linux, Command on
         * Mac) was pressed when the event occurred.
         */
        isPlatformModifierKey(): boolean;
    }
}
