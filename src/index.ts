
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
    operand: number;
};

type ReturnOpcode = {
    type: 'Return',
};

type LdaZeroOpcode = {
    type: 'LdaZero',
};

type LdaSmiOpcode = {
    type: 'LdaSmi',
    operand: number
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
};

type AddOpcode = {
    type: 'Add';
    reg: string;
    operand: number;
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
    next: string;
    sequential: boolean;
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
            this.acc.push(op.operand);
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
            const left = this.acc.pop();
            const right = this.getFromRegister(op.reg);

            this.acc.push(
                left > right
            );
        },
        Inc: (op) => {
            this.acc.push(
                this.acc.pop() + 1
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
                /**
                 * Bytecode execution is not sequential, there are instructions
                 * with ability to jump to address, let's store address of current opcode
                 * because nextAddress can be changed
                 */
                const address = this.nextAddress;
                const opcode = program.opcodes[address];

                /**
                 * Change nextAddress to 0x1 to detect indirection instructions like jump
                 */
                this.nextAddress = '0x1';

                if (opcode.type in this.handlers) {
                    this.handlers[opcode.type](opcode as any);
                } else {
                    throw new Error(`Unsupported opcode ${opcode.type} at ${address}`)
                }

                const sequential = this.nextAddress === '0x1';

                /**
                 * Executed handler didnt specify nextAddress for jump
                 * Let's use sequential execution
                 */
                if (sequential) {
                    let nextAddress = null;

                    const index = queue.findIndex((v) => v === address);
                    if (index !== -1) {
                        if (queue[index + 1]) {
                            nextAddress = queue[index + 1];
                        }
                    }

                    if (nextAddress) {
                        this.nextAddress = nextAddress;
                    } else {
                        // Last opcode in program
                        yield {
                            opcode,
                            address,
                            sequential,
                            next: this.nextAddress,
                            acc: this.acc,
                            registers: this.registers,
                        };

                        break;
                    }
                }

                yield {
                    opcode,
                    address,
                    sequential,
                    next: this.nextAddress,
                    acc: this.acc,
                    registers: this.registers,
                };
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
