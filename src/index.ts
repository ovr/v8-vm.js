
class Frame {

}

class Scope {

}

type StackCheckOpcode = {
    type: 'StackCheck',
};

type LdaZeroOpcode = {
    type: 'LdaZero',
};

type LdaSmiOpcode = {
    type: 'LdaSmi',
    operand: number[]
};

type StarOpcode = {
    type: 'Star',
    reg: string
};

type LdarOpcode = {
    type: 'Ldar',
    reg: string
};

type AddOpcode = {
    type: 'Add';
    reg: string;
    operand: number[];
};

// @link https://github.com/v8/v8/blob/master/src/compiler/opcodes.h
// @link https://github.com/v8/v8/blob/master/src/interpreter/bytecodes.h
type Opcode = StackCheckOpcode | LdaZeroOpcode | LdaSmiOpcode | StarOpcode | LdarOpcode | AddOpcode;
type Instructions = {[address: string]: Opcode};

export class Program {
    get opcodes(): Instructions {
        return this._opcodes;
    }

    private _opcodes: Instructions = {};

    constructor(opcodes: Instructions) {
        this._opcodes = opcodes;
    }
}

type OpcodeExecutor<O> = (opcode: O) => any;
type OpcodeHandlers = {
    StackCheck: OpcodeExecutor<StackCheckOpcode>;
    Star: OpcodeExecutor<StarOpcode>;
    LdaZero: OpcodeExecutor<LdaZeroOpcode>;
    LdaSmi: OpcodeExecutor<LdaSmiOpcode>;
    Ldar: OpcodeExecutor<LdarOpcode>;
    Add: OpcodeExecutor<AddOpcode>;
    [key: string]: OpcodeExecutor<any>;
};

type Accumulator = any[];
type Registers = {[key: string]: any};

type ExecutionResult = {
    acc: Accumulator,
    registers: Registers,
};

type ExecutionStep = {
    opcode: Opcode;
    address: string;
    acc: Accumulator;
    registers: Registers,
};

export class VirtualMachine {
    protected acc: Accumulator = [];
    protected registers: Registers = {};

    protected handlers: OpcodeHandlers = {
        StackCheck: () => {},
        // Store accumulator to register <dst>.
        Star: (op) => {
            this.putToRegister(
                op.reg,
                this.acc.pop()
            );
        },
        // Load literal '0' into the accumulator.
        LdaZero: () => {
            this.acc.push(0);
        },
        // Load an integer literal into the accumulator as a Smi.
        LdaSmi: (op) => {
            this.acc.push(op.operand[0]);
        },
        // Load accumulator with value from register <src>.
        Ldar: (op) => {
            this.acc.push(
                this.getFromRegister(op.reg)
            )
        },
        // Add register <src> to accumulator.
        Add: (op) => {
            this.acc.push(
                this.acc.pop() + this.getFromRegister(op.reg)
            )
        }
    };

    protected getFromRegister(reg: string)
    {
        if (reg in this.registers) {
            return this.registers[reg];
        }

        throw new Error(`Unknown register: ${reg}`);
    }

    protected putToRegister(reg: string, value: number)
    {
        this.registers[reg] = value;
    }

    public execute(program: Program): ExecutionResult
    {
        for (const [address, opcode] of Object.entries(program.opcodes)) {
            if (opcode.type in this.handlers) {
                this.handlers[opcode.type](opcode as any);
            } else {
                throw new Error(`Unsupported opcode ${opcode.type} at ${address}`)
            }
        }

        return {
            acc: this.acc,
            registers: this.registers,
        };
    }

    public* executor(program: Program): Generator<ExecutionStep, ExecutionResult>
    {
        for (const [address, opcode] of Object.entries(program.opcodes)) {
            if (opcode.type in this.handlers) {
                this.handlers[opcode.type](opcode as any);

                yield {
                    opcode,
                    address,
                    acc: this.acc,
                    registers: this.registers,
                };
            } else {
                throw new Error(`Unsupported opcode ${opcode.type} at ${address}`)
            }
        }

        return {
            acc: this.acc,
            registers: this.registers,
        };
    }
}
