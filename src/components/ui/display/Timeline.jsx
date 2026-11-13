import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NoDataFound from '@/components/feedback/NoDataFound';

const Timeline = ({ data }) => {
    const renderTimeline = () => {
        if (data.length == 0) {
            return (
                <NoDataFound></NoDataFound>
            );
        }

        return data?.map((row, index) => {
            return (
                <li className="mb-4 ms-6 shadow-md p-2 rounded-lg bg-surface border border-border text-content" key={`timelapse-${index}`}>
                    <span className="absolute flex items-center justify-center w-8 h-8 bg-info-subtle rounded-full -inset-s-3 ring-6 ring-surface text-info">
                        <FontAwesomeIcon icon={faClockRotateLeft} width="18" height="18" />
                    </span>
                    <h3 className="mb-1 ml-2 text-sm font-semibold text-content">{row?.title}</h3>
                    <time className="block mb-2 ml-2 text-sm font-normal leading-none text-content-muted">{row?.time}</time>
                    <div className="text-sm font-normal text-content-secondary ml-2 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:list-inside [&>ol]:list-inside" dangerouslySetInnerHTML={{ __html: row?.description }} />
                </li>
            );
        })
    }

    return (
        <ol className="relative border-l-2 border-border pb-40">
            {renderTimeline()}
        </ol>
    );
}
export default Timeline;
