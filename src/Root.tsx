import {Composition} from "remotion";
import {GoldShort, goldShortSchema, calculateGoldShortMetadata} from "./GoldShort";
import {GOLD_SHORT_STYLE as S} from "./GoldShort/style";
export const RemotionRoot = () => <Composition id="GoldShort" component={GoldShort} schema={goldShortSchema} calculateMetadata={calculateGoldShortMetadata} width={S.width} height={S.height} defaultProps={{videoFile:"example.mp4", captionsFile:"example.json", focusX:50, topics:[], badges:[], steps:[], zoomCuts:[]}} />;
