
class Frame {

}

class Scope {

}

type StackCheckOpcode = {
    type: 'StackCheck',
};

type JumpIfFalseOpcode = {
    type: 'JumpIfFalse',
    address: string;
};

type JumpLoopOpcode = {
    type: 'JumpLoop',
    address: string;
};

type IncOpcode = {
    type: 'Inc',
    slot: number;
};

type ReturnOpcode = {
    type: 'Return',
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

type TestLessThanOpcode = {
    type: 'TestLessThan';
    reg: string;
    slot: number;
};

type AddOpcode = {
    type: 'Add';
    reg: string;
    operand: number[];
};

// @link https://github.com/v8/v8/blob/master/src/compiler/opcodes.h
// @link https://github.com/v8/v8/blob/master/src/interpreter/bytecodes.h
type Opcode = StackCheckOpcode | JumpIfFalseOpcode | JumpLoopOpcode | ReturnOpcode | IncOpcode | LdaZeroOpcode | LdaSmiOpcode | StarOpcode | LdarOpcode | AddOpcode | TestLessThanOpcode;
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
    Return: OpcodeExecutor<ReturnOpcode>;
    Inc: OpcodeExecutor<IncOpcode>;
    JumpIfFalse: OpcodeExecutor<JumpIfFalseOpcode>;
    JumpLoop: OpcodeExecutor<JumpLoopOpcode>;
    Star: OpcodeExecutor<StarOpcode>;
    LdaZero: OpcodeExecutor<LdaZeroOpcode>;
    LdaSmi: OpcodeExecutor<LdaSmiOpcode>;
    Ldar: OpcodeExecutor<LdarOpcode>;
    Add: OpcodeExecutor<AddOpcode>;
    TestLessThan: OpcodeExecutor<TestLessThanOpcode>;
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
    protected accumulator: Registers = {};
    protected nextAddress: string = '0x1';

    protected handlers: OpcodeHandlers = {
        StackCheck: () => {},
        Return: () => {},
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
        },
        TestLessThan: (op) => {
            const left = this.getBySlotFromAccumulator(op.slot);
            const right = this.getFromRegister(op.reg);

            this.acc.push(
                left > right
            );
        },
        Inc: (op) => {
            this.putBySlotInAccumulator(
                op.slot,
                this.getBySlotFromAccumulator(op.slot) + 1
            );
        },
        JumpIfFalse: (op) => {
            const result = this.acc.pop();
            if (result === false) {
                this.nextAddress = op.address;
            }
        },
        JumpLoop: (op) => {
            this.nextAddress = op.address;
        },
    };

    protected putBySlotInAccumulator(slot: number, value: any)
    {
        this.acc[slot] = value;
    }

    protected getBySlotFromAccumulator(slot: number)
    {
        if (slot in this.acc) {
            return this.acc[slot];
        }

        throw new Error(`Unable to get value from accumulator by slot: ${slot}`);
    }

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
        const executor = this.executor(program);

        for (const opcode in executor) {

        }

        return {
            acc: this.acc,
            registers: this.registers,
        };
    }

    public* executor(program: Program): Generator<ExecutionStep, ExecutionResult>
    {
        const queue = Object.keys(program.opcodes);

        this.nextAddress = queue[0];

        while (true) {
            if (this.nextAddress in program.opcodes) {
                const opcode = program.opcodes[this.nextAddress];

                if (opcode.type in this.handlers) {
                    this.handlers[opcode.type](opcode as any);
                } else {
                    throw new Error(`Unsupported opcode ${opcode.type} at ${this.nextAddress}`)
                }

                yield {
                    opcode,
                    address: this.nextAddress,
                    acc: this.acc,
                    registers: this.registers,
                };

                const index = queue.findIndex((v) => v === this.nextAddress);
                if (index !== -1) {
                    const nextAddress = queue[index + 1];
                    if (nextAddress) {
                        this.nextAddress = queue[index + 1];
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } else {
                throw new Error(`Unknown address: "${this.nextAddress}"`)
            }
        }

        return {
            acc: this.acc,
            registers: this.registers,
        };
    }
}
