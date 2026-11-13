import RangeSlider from "@/components/ui/inputs/RangeSlider";

const LanguageRangeSlider = ({ value, id, label, onChange }) => {
    const setSliderValue = (value) => {
        onChange(id, value);
    }

    return (
        <RangeSlider
            value={value}
            onChange={onChange}
            id={id}
            label={label}
            min={2}
            max={4}
            step={1}
            enableMinMax
            renderMinMax={
                <>
                    <span
                        className={`text-xs xl:text-sm font-medium ${Number(value) === 2 ? "text-content" : "text-content-muted"} -bottom-6 hover:cursor-pointer inset-s-0`}
                        onClick={() => {
                            setSliderValue(2);
                        }}
                    >
                        Intermediário
                    </span>
                    <span
                        className={`text-xs xl:text-sm font-medium ${Number(value) === 3 ? "text-content" : "text-content-muted"} -bottom-6 hover:cursor-pointer inset-s-0`}
                        onClick={() => {
                            setSliderValue(3);
                        }}
                    >
                        Avançado
                    </span>
                    <span
                        className={`text-xs xl:text-sm font-medium ${Number(value) === 4 ? "text-content" : "text-content-muted"} -bottom-6 hover:cursor-pointer inset-s-0`}
                        onClick={() => {
                            setSliderValue(4);
                        }}
                    >
                        Fluente
                    </span>
                </>
            }
        />
    );
};

export default LanguageRangeSlider;
