import {VirtualMachine, Program} from './../src';

const vm = new VirtualMachine();
const executor = vm.executor(
    new Program({
        '0x0': {
            type: 'StackCheck'
        },
        '0x1': {
            type: 'LdaSmi',
            operand: 3,
        },
        '0x2': {
            type: 'Star',
            reg: 'r0',
        },
        '0x3': {
            type: 'LdaSmi',
            operand: 4,
        },
        '0x4': {
            type: 'Star',
            reg: 'r1',
        },
        '0x5': {
            type: 'Ldar',
            reg: 'r1',
        },
        '0x6': {
            type: 'Add',
            reg: 'r0',
            operand: 0
        },
    })
);

for (const op of executor) {
    console.log(op);
}
