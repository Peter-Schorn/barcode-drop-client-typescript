import {
    useState,
    useEffect,
    useCallback
} from "react";

import { useUrlFragmentParamLogger as logger } from "../utils/loggers";

type URLFragmentParamSetter<T> = (
    newValue: T | ((prevValue: T) => T)
) => void;

/**
 * A function that parses the fragment parameter from a string to a value.
 *
 * @param value The value to parse. If the value is null, then the parameter is
 * not set in the URL fragment.
 */
type URLFragmentParamParser<T> = (value: string | null) => T;

/**
 * A function that encodes the fragment parameter to `string | null`.
 *
 * @param value The value to encode.
 * @returns The encoded value. If the value is null, then the parameter will be
 * removed from the URL fragment.
 */
type URLFragmentParamEncoder<T> = (value: T) => string | null;

/**
 * Options for the `useURLFragmentParam` hook.
 *
 * @param parseValue A function to parse the value of the URL fragment
 * parameter.
 * @param encodeValue A function to encode the value of the URL fragment
 * parameter to `string | null`.
 */
type UseURLFragmentParamOptions<T> = {
    parseValue: URLFragmentParamParser<T>;
    encodeValue: URLFragmentParamEncoder<T>;
};

// The overloads are necessary to prevent TypeScript from allowing the wrong
// type parameter from being used when the default value for `parseValue` is
// used. For example, this should not be allowed:
//
// const [param, setParam] = useURLFragmentParam<number>("key");
//                                               ^^^^^^
//
// Without the overloads, this would be allowed because the default value for
// `parseValue` is `(value) => (value as T)`. `as T` allows any type parameter
// to be used, which is not what we want.

export function useURLFragmentParam(
    key: string
): [string | null, URLFragmentParamSetter<string | null>];

export function useURLFragmentParam<T>(
    key: string,
    options: UseURLFragmentParamOptions<T>
): [T, URLFragmentParamSetter<T>];

/**
 * A hook to get and set the value of a URL fragment parameter.
 *
 * @param key The key of the URL fragment parameter.
 * @param options An object containing options for the hook.
 * @param options.parseValue A function to parse the value of the URL fragment
 * parameter.
 * @param options.encodeValue A function to encode the value of the URL fragment
 * parameter.
 * @returns A tuple containing the current value of the URL fragment parameter,
 * or null if the parameter is not set, and a function to set the value of the
 * URL fragment parameter.
 */
export function useURLFragmentParam<T>(
    key: string,
    {
        parseValue,
        encodeValue
    }: UseURLFragmentParamOptions<T> = {
        // these defaults should only be used when `T` is `string | null`,
        // which is enforced by the overload signatures
        parseValue: (value) => (value as T),
        encodeValue: (value) => (value as string | null)
    }
): [T, URLFragmentParamSetter<T>] {

    const [param, setParamState] = useState<T>(
        () => parseValue(getURLFragmentParam(key))
    );

    useEffect(() => {

        logger.debug(
            `useURLFragmentParam: setup: key=${key}`
        );

        function onHashChange(): void {
            logger.debug(
                `useURLFragmentParam: onHashChange: key=${key}`
            );
            setParamState(parseValue(getURLFragmentParam(key)));
        }

        window.addEventListener("hashchange", onHashChange);
        return (): void => {
            logger.debug(
                `useURLFragmentParam: cleanup: key=${key}`
            );
            window.removeEventListener("hashchange", onHashChange);
        };
    }, [key, parseValue]);

    const setParam = useCallback<URLFragmentParamSetter<T>>((setter) => {

        let newValue: string | null;

        if (typeof setter === "function") {
            const setterFn = setter as (prevValue: T) => T;
            const prevValue = parseValue(getURLFragmentParam(key));
            newValue = encodeValue(setterFn(prevValue));
        } else {
            newValue = encodeValue(setter);
        }

        setURLFragmentParam(key, newValue);
        // After setting the URL fragment parameter, the `param` state variable
        // will be updated by the hashchange event listener. Therefore, we don't
        // need to call setParamState here.

    }, [key, parseValue, encodeValue]);

    return [param, setParam];
}

/**
 * Gets the value of a URL fragment parameter.
 *
 * @param key The key of the URL fragment parameter
 * @returns The value of the URL fragment parameter, or null if the parameter is
 * not set
 */
export function getURLFragmentParam(key: string): string | null {
    const urlFragmentParams = new URLSearchParams(
        window.location.hash.slice(1)
    );
    return urlFragmentParams.get(key);
}

/**
 * Sets the value of a URL fragment parameter.
 *
 * @param key The key of the URL fragment parameter
 * @param value The value to set the URL fragment parameter to. If an empty
 * string or null, the parameter will be removed.
 */
export function setURLFragmentParam(key: string, value: string | null): void {
    const urlFragmentParams = new URLSearchParams(
        window.location.hash.slice(1)
    );
    if (!value) {
        urlFragmentParams.delete(key);
    } else {
        urlFragmentParams.set(key, value);
    }
    window.location.hash = urlFragmentParams.toString();
}
