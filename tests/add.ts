import {VirtualMachine, Program} from './../src';

const vm = new VirtualMachine();
const executor = vm.executor(
    new Program({
        0: {
            type: 'StackCheck'
        },
        1: {
            type: 'LdaSmi',
            operand: [3],
        },
        2: {
            type: 'Star',
            reg: 'r0',
        },
        3: {
            type: 'LdaSmi',
            operand: [4],
        },
        4: {
            type: 'Star',
            reg: 'r1',
        },
        5: {
            type: 'Ldar',
            reg: 'r1',
        },
        6: {
            type: 'Add',
            reg: 'r0',
            operand: [0]
        },
    })
);

for (const op of executor) {
    console.log(op);
}
