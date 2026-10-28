import 'i18next'

import { I18N_DEFAULT_NS } from './shared/i18n/i18nConstants'
import { resources } from './shared/i18n/locales'

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: typeof I18N_DEFAULT_NS
		resources: typeof resources.en

		// if you see an error like: "Argument of type 'DefaultTFuncReturn' is not assignable to parameter of type xyz"
		// set returnNull to false (and also in the i18next init options)
		// returnNull: false;
	}
}
