import { ERROR_TYPES } from './spec';
export * from './spec';
declare type MessageType = ((args: any) => string) | string;
declare type ErrorParam = keyof typeof ERROR_TYPES | {
    message: MessageType;
};
export declare class BitcoreError extends Error {
    static Types: {
        InvalidB58Char: {
            message: string;
        };
        InvalidB58Checksum: {
            message: string;
        };
        InvalidNetwork: {
            message: string;
        };
        InvalidState: {
            message: string;
        };
        NotImplemented: {
            message: string;
        };
        InvalidNetworkArgument: {
            message: string;
        };
        InvalidArgument: {
            message(args?: string[]): string;
        };
        AbstractMethodInvoked: {
            message: string;
        };
        InvalidArgumentType: {
            message(args: string[]): string;
        };
        Unit: {
            message: string;
            errors: {
                UnknownCode: {
                    message: string;
                };
                InvalidRate: {
                    message: string;
                };
            };
        };
        MerkleBlock: {
            message: string;
            errors: {
                InvalidMerkleTree: {
                    message: string;
                };
            };
        };
        Transaction: {
            message: string;
            errors: {
                Input: {
                    message: string;
                    errors: {
                        MissingScript: {
                            message: string;
                        };
                        UnsupportedScript: {
                            message: string;
                        };
                        MissingPreviousOutput: {
                            message: string;
                        };
                    };
                };
                NeedMoreInfo: {
                    message: string;
                };
                InvalidSorting: {
                    message: string;
                };
                InvalidOutputAmountSum: {
                    message: string;
                };
                MissingSignatures: {
                    message: string;
                };
                InvalidIndex: {
                    message: string;
                };
                UnableToVerifySignature: {
                    message: string;
                };
                DustOutputs: {
                    message: string;
                };
                InvalidSatoshis: {
                    message: string;
                };
                FeeError: {
                    message: string;
                    errors: {
                        TooSmall: {
                            message: string;
                        };
                        TooLarge: {
                            message: string;
                        };
                        Different: {
                            message: string;
                        };
                    };
                };
                ChangeAddressMissing: {
                    message: string;
                };
                BlockHeightTooHigh: {
                    message: string;
                };
                NLockTimeOutOfRange: {
                    message: string;
                };
                LockTimeTooEarly: {
                    message: string;
                };
            };
        };
        Script: {
            message: string;
            errors: {
                UnrecognizedAddress: {
                    message: string;
                };
                CantDeriveAddress: {
                    message: string;
                };
                InvalidBuffer: {
                    message: string;
                };
            };
        };
        HDPrivateKey: {
            message: string;
            errors: {
                InvalidDerivationArgument: {
                    message: string;
                };
                InvalidEntropyArgument: {
                    message: string;
                    errors: {
                        TooMuchEntropy: {
                            message: string;
                        };
                        NotEnoughEntropy: {
                            message: string;
                        };
                    };
                };
                InvalidLength: {
                    message: string;
                };
                InvalidPath: {
                    message: string;
                };
                UnrecognizedArgument: {
                    message: string;
                };
            };
        };
        HDPublicKey: {
            message: string;
            errors: {
                ArgumentIsPrivateExtended: {
                    message: string;
                };
                InvalidDerivationArgument: {
                    message: string;
                };
                InvalidLength: {
                    message: string;
                };
                InvalidPath: {
                    message: string;
                };
                InvalidIndexCantDeriveHardened: {
                    message: string;
                };
                MustSupplyArgument: {
                    message: string;
                };
                UnrecognizedArgument: {
                    message: string;
                };
            };
        };
    };
    constructor(errType: ErrorParam, ...args: any[]);
}
