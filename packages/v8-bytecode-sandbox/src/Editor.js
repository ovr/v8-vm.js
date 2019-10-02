import React, { PureComponent } from 'react';
import {VirtualMachine, Program} from 'v8-vm.js';

import './Editor.css';

const defaultByteCodeAExample = {
    '0x00000001': {
        type: 'StackCheck'
    },
    '0x00000002': {
        type: 'LdaSmi',
        operand: [3],
    },
    '0x00000003': {
        type: 'Star',
        reg: 'r0',
    },
    '0x00000004': {
        type: 'LdaSmi',
        operand: [4],
    },
    '0x00000005': {
        type: 'Star',
        reg: 'r1',
    },
    '0x00000006': {
        type: 'Ldar',
        reg: 'r1',
    },
    '0x00000007': {
        type: 'Add',
        reg: 'r0',
        operand: [0]
    }
};

const defaultByteCodeBExample = {
    '0x33053be60556': {
        type: 'StackCheck'
    },
    '0x33053be60557': {
        type: 'LdaZero',
    },
    '0x33053be60558': {
        type: 'Star',
        reg: 'r0',
    },
    '0x33053be6055a': {
        type: 'LdaSmi',
        operand: [100],
    },
    '0x33053be6055c': {
        type: 'TestLessThan',
        reg: 'r0',
        slot: 0,
    },
    '0x33053be6055f': {
        type: 'JumpIfFalse',
        address: '0x33053be6056b',
    },
    '0x33053be60561': {
        type: 'StackCheck'
    },
    '0x33053be60562': {
        type: 'Ldar',
        reg: 'r0'
    },
    '0x33053be60564': {
        type: 'Inc',
        slot: 1
    },
    '0x33053be60566': {
        type: 'Star',
        reg: 'r0'
    },
    '0x33053be60568': {
        type: 'JumpLoop',
        address: '0x33053be6055a'
    },
    '0x33053be6056b': {
        type: 'Return',
    },
};

const defaultByteCodeCExample = {
    '0x00000001': {
        type: 'StackCheck'
    },
};

export default class Editor extends PureComponent {
    state = {
        codeParseError: null,
        executor: null,
        before: null,
        realm: null,
        code: {},
    };

    area = null;

    componentDidMount() {
        this.loadExample(defaultByteCodeAExample);
    }

    renderByteCode() {
        const { code, codeParseError } = this.state;

        if (codeParseError) {
            return (
                <div className="ByteCodeArea">
                    Unable to parse {codeParseError}
                </div>
            );
        }

        return (
            <div className="ByteCodeArea">
                {Object.entries(code).map(([address, opcode]) => {
                    let className = 'Row';

                    const active = this.state.realm && this.state.realm.address == address;
                    if (active) {
                        className = 'Row Row-Active';
                    } else {
                        const before = this.state.before && this.state.before.address == address;
                        if (before) {
                            className = 'Row Row-Before';
                        }
                    }

                    return (
                        <div className={className} key={`row-${address}`}>
                            <div>{address}</div>
                            <div>{opcode.type}</div>
                            <div>
                                {JSON.stringify({
                                    reg: opcode.reg,
                                    operand: opcode.operand
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        )
    }

    onExecuteTillFinishClick = () => {
        if (this.state.executor) {
            for (const opcode of this.state.executor) {
                console.log('tick', opcode);

                this.setState({
                    realm: opcode,
                })
            }
        }
    }

    onReset = () => {
        const { code } = this.state;

        if (code) {
            this.setState({
                executor: (new VirtualMachine()).executor(new Program(code)),
                last: null,
                realm: null,
            })
        }
    }

    onNextTickClick = () => {
        if (this.state.executor) {
            const last = this.state.executor.next();

            console.log('tick', last);
    
            if (!last.done) {
                this.setState({
                    before: this.state.realm || null,
                    realm: last.value,
                })
            }
        }
    }

    renderExecution() {
        const { realm } = this.state;

        return (
            <div className="VmInfoArea">
                <div>
                    <button onClick={this.onNextTickClick} className="btn tick-btn">Tick</button>
                    <button onClick={this.onExecuteTillFinishClick} className="btn execute-btn">Execute</button>
                    <button onClick={this.onReset} className="btn reset-btn">Reset</button>
                </div>
                {
                    realm ? (
                        <div>
                            <div>
                                Accumulator {JSON.stringify(realm.acc)}
                            </div>
                            <div>
                                Registers {JSON.stringify(realm.registers)}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2>No execution</h2>
                        </div> 
                    )
                }
            </div>
        );
    }

    getCodeAsString() {
        return JSON.stringify(this.state.code, null, 2)
    }

    renderEditor() {
        return (
            <textarea
                className="CodeArea"
                onChange={this.onCodeChange}
                defaultValue={this.getCodeAsString()}
                ref={(area) => { this.area = area; }}
            />
        );
    }

    onCodeChange = (e) => {
        try {
            const code = JSON.parse(e.target.value);

            this.setState({
                code,
                codeParseError: null,
            });
        } catch (e) {
            this.setState({
                code: null,
                codeParseError: e,
            });
        }
    }

    loadExample = (code) => {
        this.setState({
            code,
            executor: (new VirtualMachine()).executor(new Program(code)),
        }, () => {
            if (this.area) {
                this.area.value = this.getCodeAsString();
            }
        })
    };

    render() {
        return (
            <div className="Emulator">
                <div>
                    <button className="btn" onClick={() => this.loadExample(defaultByteCodeAExample)}>
                        {"Example (a + b)"}
                    </button>
                    <button className="btn" onClick={() => this.loadExample(defaultByteCodeBExample)}>
                        {"Example (while loop with total number < 100)"}
                    </button>
                </div>
                <div>
                    {this.renderEditor()}
                    {this.renderByteCode()}
                    {this.renderExecution()}
                </div>
            </div>
        )
    }
}