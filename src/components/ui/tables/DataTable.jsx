import { useCallback, useEffect, useState } from "react";
import InputText from '@/components/ui/inputs/InputText';

const alignClass = (align) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
};

const DataTable = ({ data, header, dense, mainText, action }) => {
    const [tableBody, setTableBody] = useState([]);
    const [thead, setThead] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [filter, setFilter] = useState({
        filtra_table: ""
    });

    useEffect(() => {
        theadToHtml();
    }, [header]);

    useEffect(() => {
        setTableData(data);
    }, [data]);

    useEffect(() => {
        dataToHtml();
    }, [tableData]);

    useEffect(() => {
        if (data) {
            setTableData(data.filter(item =>
                Object.values(item).some(v =>
                    typeof v === 'string' && v.toLowerCase().includes(filter.filtra_table.toLowerCase())
                )
            ));
        }
    }, [filter]);

    const theadToHtml = () => {
        setThead(header.map(title => {
            return (
                <th scope="col" className={`${dense ? " px-2 py-1 " : " px-4 py-2 "} ${alignClass(title?.align)}`} key={title.label}>
                    <div className="inline-flex items-center" title={`${title?.title || ""}`}>
                        {title.label}
                    </div>
                </th>
            );
        }));
    }

    const dataToHtml = () => {
        if (!tableData || tableData.length === 0) {
            return setTableBody(
                <tr className="bg-surface">
                    <td colSpan={header.length || 1} className="px-4 py-6 text-center italic text-content-muted">
                        Não há dados para exibir...
                    </td>
                </tr>
            );
        }

        setTableBody(tableData.map((item, index) => {
            const getColumns = () => {
                var chaves = Object.keys(item);
                return chaves.map((chave, indexChave) => {
                    return (
                        <td
                            className={`${dense ? " px-2 py-1 " : " px-4 py-2 "} ${alignClass(header[indexChave]?.align)} text-content-secondary`}
                            key={chave}
                        >
                            {item[chave]}
                        </td>
                    );
                });
            }
            return (
                <tr
                    className="odd:bg-surface even:bg-surface-secondary hover:bg-hover border-b border-border transition-colors"
                    key={`tr-${index}`}
                >
                    {getColumns()}
                </tr>
            );
        }));
    }

    const setFilterTextCallback = useCallback((id, value) => {
        setFilter(prevFormFilterStatus => ({
            ...prevFormFilterStatus,
            [id]: value
        }));
    }, [setFilter]);

    return (
        <div className="flex w-full flex-wrap bg-surface border border-border rounded-lg shadow-sm overflow-hidden max-h-[80%]">
            <div className="bg-surface-secondary border-b border-border flex flex-wrap gap-2 px-4 py-2 items-center justify-between w-full">
                <div className="text-content font-medium">{mainText}</div>
                <div className="flex items-center gap-2">
                    <div>{action}</div>
                    <div className="w-32">
                        <InputText placeholder="Filtrar" onChange={setFilterTextCallback} id="filtra_table" clearable={true} />
                    </div>
                </div>
            </div>
            <div className="relative overflow-x-auto w-full max-h-full overflow-y-auto">
                <table className="w-full text-sm text-left rtl:text-right text-content-secondary">
                    <thead className="text-xs text-content uppercase bg-surface-muted sticky top-0 z-10 border-b border-border">
                        <tr>{thead}</tr>
                    </thead>
                    <tbody>
                        {tableBody}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-surface-secondary border-t border-border text-content-secondary">
                        <tr>
                            <td colSpan={header.length || 1} className={`${dense ? " px-2 py-1 " : " px-4 py-2 "}`}>
                                Exibindo {tableData.length} registros
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

    );
}
export default DataTable;
