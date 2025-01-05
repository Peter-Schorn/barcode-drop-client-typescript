export {};

declare global {
    interface KeyboardEvent {
        isPlatformModifierKey(): boolean;
    }
}
