import { webpack } from 'next/dist/compiled/webpack/webpack';
import { ConfigurationContext } from '../../../utils';
export declare function getCssModuleLoader(ctx: ConfigurationContext, hasAppDir: boolean, postcss: any, preProcessors?: readonly webpack.RuleSetUseItem[]): webpack.RuleSetUseItem[];
