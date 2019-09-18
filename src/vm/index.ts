
class Frame {

}

class Scope {

}

type StackCheck = {
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
type Opcode = StackCheck | LdaZeroOpcode | LdaSmiOpcode | StarOpcode | LdarOpcode | AddOpcode;

class Program {
    get opcodes(): Opcode[] {
        return this._opcodes;
    }

    private _opcodes: Opcode[] = [];

    constructor(opcodes: Opcode[]) {
        this._opcodes = opcodes;
    }
}

type OpcodeExecutor<O> = (opcode: O) => any;
type OpcodeHandlers = {
    Star: OpcodeExecutor<StarOpcode>;
    LdaZero: OpcodeExecutor<LdaZeroOpcode>;
    LdaSmi: OpcodeExecutor<LdaSmiOpcode>;
    Ldar: OpcodeExecutor<LdarOpcode>;
    Add: OpcodeExecutor<AddOpcode>;
    [key: string]: OpcodeExecutor<any>;
};

class VirtualMachine {
    protected acc: any[] = [];
    protected r0: any;
    protected r1: any;

    protected handlers: OpcodeHandlers = {
        // Store accumulator to register <dst>.
        'Star': (op) => {
            this.putToRegister(
                op.reg,
                this.acc.pop()
            );
        },
        // Load literal '0' into the accumulator.
        'LdaZero': () => {
            this.acc.push(0);
        },
        // Load an integer literal into the accumulator as a Smi.
        'LdaSmi': (op) => {
            this.acc.push(op.operand[0]);
        },
        // Load accumulator with value from register <src>.
        'Ldar': (op) => {
            this.acc.push(
                this.getFromRegister(op.reg)
            )
        },
        // Add register <src> to accumulator.
        'Add': (op) => {
            this.acc.push(
                this.acc.pop() + this.getFromRegister(op.reg)
            )
        }
    };

    protected getFromRegister(reg: string)
    {
        switch (reg) {
            case 'r0':
                return this.r0;
            case 'r1':
                return this.r1;
            default:
                throw new Error(`Unknown register: ${reg}`);
        }
    }

    protected putToRegister(reg: string, value: number)
    {
        switch (reg) {
            case 'r0':
                this.r0 = value;
                break;
            case 'r1':
                this.r1 = value;
                break;
            default:
                throw new Error(`Unknown register: ${reg}`);
        }
    }

    public execute(program: Program)
    {
        for (const opcode of program.opcodes) {
            if (opcode.type in this.handlers) {
                this.handlers[opcode.type](opcode);
            } else {
                throw new Error(`Unsupported opcode ${opcode.type}`)
            }
        }

        console.log('Acc', this.acc);
        console.log('r0', this.r0);
        console.log('r1', this.r1);
    }
}

const vm = new VirtualMachine();
vm.execute(
    new Program([
        {
            type: 'LdaSmi',
            operand: [3],
        },
        {
            type: 'Star',
            reg: 'r0',
        },
        {
            type: 'LdaSmi',
            operand: [4],
        },
        {
            type: 'Star',
            reg: 'r1',
        },
        {
            type: 'Ldar',
            reg: 'r1',
        },
        {
            type: 'Add',
            reg: 'r0',
            operand: [0]
        },
    ])
);
