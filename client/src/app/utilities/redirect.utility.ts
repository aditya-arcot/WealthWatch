import { ActivatedRoute, Params, Router } from '@angular/router'

export const redirectWithParams = (
    router: Router,
    route: ActivatedRoute,
    params: Params,
    merge = true
): void => {
    void router.navigate([], {
        relativeTo: route,
        queryParams: params,
        queryParamsHandling: merge ? 'merge' : 'replace',
    })
}
