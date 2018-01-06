import codeframe from '../src';

const rawLines = `<div class="home">
    <h1 class="title">
        {{ message }}
    </h1>
    {% for key in [1,2,3,4] %}
        <div>
            {% mount '../counter' as key with { count: 5 } %}
        </div>
    {% endfor %}
</div>`;

describe('codeframe', () => {
    it('should match output with line -1, col -1 and length -1', () => {
        const input = {
            rawLines,
            lineNumber: -1,
            colNumber: -1,
            length: -1,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 0, col 1 and length 0', () => {
        const input = {
            rawLines,
            lineNumber: 0,
            colNumber: 1,
            length: 0,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 1, col 1 and length 1', () => {
        const input = {
            rawLines,
            lineNumber: 1,
            colNumber: 1,
            length: 1,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });
    it('should match output with line 2, col 4 and length 2', () => {
        const input = {
            rawLines,
            lineNumber: 2,
            colNumber: 4,
            length: 2,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 5, col 4 and length 1', () => {
        const input = {
            rawLines,
            lineNumber: 5,
            colNumber: 4,
            length: 1,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 5, col 44 and length 2', () => {
        const input = {
            rawLines,
            lineNumber: 5,
            colNumber: 44,
            length: 2,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 5, col 14 and length 4', () => {
        const input = {
            rawLines,
            lineNumber: 5,
            colNumber: 14,
            length: 4,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 5, col -1 and length 1', () => {
        const input = {
            rawLines,
            lineNumber: 5,
            colNumber: -1,
            length: 1,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 10, col 1 and length 1', () => {
        const input = {
            rawLines,
            lineNumber: 10,
            colNumber: 1,
            length: 1,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 10, col 1 and length 0', () => {
        const input = {
            rawLines,
            lineNumber: 10,
            colNumber: 1,
            length: 0,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 10, col 1 and length 2', () => {
        const input = {
            rawLines,
            lineNumber: 10,
            colNumber: 1,
            length: 2,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 15, col 1 and length 1', () => {
        const input = {
            rawLines,
            lineNumber: 15,
            colNumber: 1,
            length: 1,
        };
        expect(codeframe(input)).toEqual('');
    });

    it('should match output with line 15, col 1 and length 4', () => {
        const input = {
            rawLines,
            lineNumber: 15,
            colNumber: 1,
            length: 4,
        };
        expect(codeframe(input)).toEqual('');
    });

    it('should match output with line 15, col -1 and length 4', () => {
        const input = {
            rawLines,
            lineNumber: 15,
            colNumber: -1,
            length: 4,
        };
        expect(codeframe(input)).toEqual('');
    });

    it('should match output with line 1, col 1 and length 1 for blank rowLines', () => {
        const input = {
            rawLines: '',
            lineNumber: 1,
            colNumber: 1,
            length: 1,
        };
        expect(codeframe(input)).toMatchSnapshot();
    });

    it('should match output with line 4, col 1 and length 1 for blank rowLines', () => {
        const input = {
            rawLines: '',
            lineNumber: 4,
            colNumber: 1,
            length: 1,
        };
        expect(codeframe(input)).toEqual('');
    });
});
