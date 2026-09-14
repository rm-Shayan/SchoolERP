# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Frontend\tests\orgadmin-ui.spec.ts >> Org Admin UI Flow >> Students Page >> students page has add/import/export actions
- Location: Frontend\tests\orgadmin-ui.spec.ts:63:9

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /Add|Import|Export/i
Received string:  "School Management SystemBranch officeRun your campus operations.Manage students, admissions, fees, staff and everyday school work from one dashboard.Student recordsAdmissions & feesGate attendanceLive reportsSchool Management SystemStaffParentStudentAdminStaff PortalSign in with your school code and the credentials shared by the office.School CodeEmail or Username*Password*Sign inForgot password?Having trouble signing in? Contact your school office.self.__next_r=\"uCHCPNXE072x7oqFonOFw\";if(document.cookie.indexOf('next-instant-navigation-testing=')>-1){self.__next_instant_test=fetch(location.pathname+'?_rsc=xhdorIanPcIpYSsE',{credentials:'same-origin',headers:{'rsc':'1','next-router-prefetch':'1','next-router-segment-prefetch':'/_full'}})}(self.__next_f=self.__next_f||[]).push([0])self.__next_f.push([1,\"7:I[\\\"[project]/node_modules/next/dist/next-devtools/userspace/app/segment-explorer-node.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"SegmentViewNode\\\"]\\n9:\\\"$Sreact.fragment\\\"\\n1a:I[\\\"[project]/src/store/Providers.tsx [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"default\\\"]\\n1c:I[\\\"[project]/node_modules/next/dist/client/components/layout-router.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"default\\\"]\\n1d:I[\\\"[project]/src/app/error.tsx [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\",\\\"/_next/static/chunks/src_1w-rzk5._.js\\\"],\\\"default\\\"]\\n21:I[\\\"[project]/node_modules/next/dist/client/components/render-from-template-context.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"default\\\"]\\n35:I[\\\"[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\",\\\"/_next/static/chunks/node_modules_next_dist_00pwe04._.js\\\"],\\\"\\\"]\\n3c:I[\\\"[project]/node_modules/next/dist/client/components/layout-router.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"LoadingBoundaryProvider\\\"]\\n47:I[\\\"[project]/node_modules/next/dist/client/components/client-segment.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"ClientSegmentRoot\\\"]\\n48:I[\\\"[project]/src/app/branch/layout.tsx [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\",\\\"/_next/static/chunks/src_071eol0._.js\\\",\\\"/_next/static/chunks/node_modules_1gi61-2._.js\\\"],\\\"default\\\"]\\n4a:I[\\\"[project]/src/app/branch/error.tsx [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\",\\\"/_next/static/chunks/src_071eol0._.js\\\",\\\"/_next/static/chunks/node_modules_1gi61-2._.js\\\",\\\"/_next/static/chunks/src_app_branch_error_tsx_034uu-n._.js\\\"],\\\"default\\\"]\\n5c:I[\\\"[project]/src/features/school/components/StudentsPage.tsx [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\",\\\"/_next/static/chunks/src_071eol0._.js\\\",\\\"/_next/static/chunks/node_modules_1gi61-2._.js\\\",\\\"/_next/static/chunks/src_11c9w1m._.js\\\",\\\"/_next/static/chunks/node_modules_0kz1xs1._.js\\\"],\\\"default\\\"]\\n64:I[\\\"[project]/node_modules/next/dist/lib/framework/boundary-components.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"OutletBoundary\\\"]\\n66:\\\"$Sreact.suspense\\\"\\n74:I[\\\"[project]/node_modules/next/dist/lib/framework/boundary-components.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"ViewportBoundary\\\"]\\n7e:I[\\\"[project]/node_modules/next/dist/lib/framework/boundary-components.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"MetadataBoundary\\\"]\\n84:I[\\\"[project]/src/app/global-error.tsx [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\",\\\"/_next/static/chunks/src_app_global-error_tsx_1511-6v._.js\\\"],\\\"default\\\"]\\n:HL[\\\"/_next/static/chunks/src_app_globals_162hn9o.css\\\",\\\"style\\\"]\\n1:D\\\"$4\\\"\\n1:D\\\"$2\\\"\\n1:D\\\"$5\\\"\\n1:null\\nd:D\\\"$15\\\"\\nd:D\\\"$e\\\"\\nd:D\\\"$17\\\"\\n23:D\\\"$25\\\"\\n23:D\\\"$24\\\"\\n23:D\\\"$27\\\"\\n2c:D\\\"$32\\\"\\n2c:D\\\"$2d\\\"\\n2c:D\\\"$34\\\"\\n2c:[\\\"$\\\",\\\"$L35\\\",null,{\\\"href\\\":\\\"/login\\\",\\\"className\\\":\\\"mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2\\\",\\\"children\\\":[[\\\"$\\\",\\\"svg\\\",null,{\\\"className\\\":\\\"h-4 w-4\\\",\\\"fill\\\":\\\"none\\\",\\\"viewBox\\\":\\\"0 0 24 24\\\",\\\"stroke\\\":\\\"currentColor\\\",\\\"children\\\":[\\\"$\\\",\\\"path\\\",null,{\\\"strokeLinecap\\\":\\\"round\\\",\\\"strokeLinejoin\\\":\\\"round\\\",\\\"strokeWidth\\\":2,\\\"d\\\":\\\"M10 19l-7-7m0 0l7-7m-7 7h18\\\"},\\\"$24\\\",\\\"$37\\\",1]},\\\"$24\\\",\\\"$36\\\",1],\\\"Go to Login\\\"]},\\\"$2d\\\",\\\"$33\\\",1]\\n23:[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center\\\",\\\"children\\\":[[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex h-24 w-24 items-center justify-center rounded-full bg-slate-100\\\",\\\"children\\\":[\\\"$\\\",\\\"span\\\",null,{\\\"className\\\":\\\"text-6xl font-black text-slate-300\\\",\\\"children\\\":\\\"404\\\"},\\\"$24\\\",\\\"$29\\\",1]},\\\"$24\\\",\\\"$28\\\",1],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"mt-6 text-3xl font-black tracking-tight text-slate-900\\\",\\\"children\\\":\\\"Page not found\\\"},\\\"$24\\\",\\\"$2a\\\",1],[\\\"$\\\",\\\"p\\\",null,{\\\"className\\\":\\\"mt-3 max-w-md text-base leading-7 text-slate-500\\\",\\\"children\\\":\\\"The page you are looking for does not exist or has been moved.\\\"},\\\"$24\\\",\\\"$2b\\\",1],\\\"$2c\\\"]},\\\"$24\\\",\\\"$26\\\",1]\\nd:[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"en\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"className\\\":\\\"antialiased\\\",\\\"children\\\":[\\\"$\\\",\\\"$L1a\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L1c\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$1d\\\",\\\"errorStyles\\\":[\\\"$\\\",\\\"$L7\\\",null,{\\\"type\\\":\\\"error\\\",\\\"pagePath\\\":\\\"error.tsx\\\",\\\"children\\\":[]},null,\\\"$1e\\\",0],\\\"errorScripts\\\":[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/src_1w-rzk5._.js\\\",\\\"async\\\":true},null,\\\"$1f\\\",0]],\\\"template\\\":[\\\"$\\\",\\\"$L21\\\",null,{},null,\\\"$20\\\",1],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":[\\\"$\\\",\\\"$L7\\\",\\\"c-not-found\\\",{\\\"type\\\":\\\"not-found\\\",\\\"pagePath\\\":\\\"not-found.tsx\\\",\\\"children\\\":[\\\"$23\\\",[]]},null,\\\"$22\\\",0],\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\",\\\"segmentViewBoundaries\\\":[[\\\"$\\\",\\\"$L7\\\",null,{\\\"type\\\":\\\"boundary:not-found\\\",\\\"pagePath\\\":\\\"not-found.tsx@boundary\\\"},null,\\\"$38\\\",1],\\\"$undefined\\\",[\\\"$\\\",\\\"$L7\\\",null,{\\\"type\\\":\\\"boundary:error\\\",\\\"pagePath\\\":\\\"error.tsx@boundary\\\"},null,\\\"$39\\\",1],[\\\"$\\\",\\\"$L7\\\",null,{\\\"type\\\":\\\"boundary:global-error\\\",\\\"pagePath\\\":\\\"global-error.tsx\\\"},null,\\\"$3a\\\",1]]},null,\\\"$1b\\\",1]},\\\"$e\\\",\\\"$19\\\",1]},\\\"$e\\\",\\\"$18\\\",1]},\\\"$e\\\",\\\"$16\\\",1]\\n3e:D\\\"$40\\\"\\n3e:D\\\"$3f\\\"\\n3e:D\\\"$41\\\"\\n3e:null\\n55:D\\\"$59\\\"\\n55:D\\\"$56\\\"\\n55:D\\\"$5b\\\"\\n55:[\\\"$\\\",\\\"$L5c\\\",null,{},\\\"$56\\\",\\\"$5a\\\",1]\\n5f:D\\\"$61\\\"\\n5f:D\\\"$60\\\"\\n5f:D\\\"$63\\\"\\n5f:[\\\"$\\\",\\\"$L64\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$66\\\",null,{\\\"name\\\":\\\"Next.MetadataOutlet\\\",\\\"children\\\":\\\"$@67\\\"},\\\"$60\\\",\\\"$65\\\",1]},\\\"$60\\\",\\\"$62\\\",1]\\n68:X\\n6a:D\\\"$6d\\\"\\n6a:D\\\"$6b\\\"\\n6a:D\\\"$6e\\\"\\n6a:null\\n6f:D\\\"$71\\\"\\n6f:D\\\"$70\\\"\\n6f:D\\\"$73\\\"\\n75:D\\\"$77\\\"\\n75:D\\\"$76\\\"\\n6f:[\\\"$\\\",\\\"$L74\\\",null,{\\\"children\\\":\\\"$L75\\\"},\\\"$70\\\",\\\"$72\\\",1]\\n78:D\\\"$7a\\\"\\n78:D\\\"$79\\\"\\n78:D\\\"$7c\\\"\\n80:D\\\"$82\\\"\\n80:D\\\"$81\\\"\\n78:[\\\"$\\\",\\\"div\\\",null,{\\\"hidden\\\":true,\\\"children\\\":[\\\"$\\\",\\\"$L7e\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$66\\\",null,{\\\"name\\\":\\\"Next.Metadata\\\",\\\"children\\\":\\\"$L80\\\"},\\\"$79\\\",\\\"$7f\\\",1]},\\\"$79\\\",\\\"$7d\\\",1]},\\\"$79\\\",\\\"$7b\\\",1]\\n83:[]\\n0:{\\\"P\\\":\\\"$1\\\",\\\"c\\\":[\\\"\\\",\\\"branch\\\",\\\"students\\\"],\\\"q\\\":\\\"\\\",\\\"i\\\":true,\\\"f\\\":[[[\\\"\\\",{\\\"children\\\":[\\\"branch\\\",{\\\"children\\\":[\\\"students\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{},\\\"$undefined\\\",\\\"$undefined\\\",4096]},\\\"$undefined\\\",\\\"$undefined\\\",4096]},\\\"$undefined\\\",\\\"$undefined\\\",4100]},\\\"$undefined\\\",\\\"$undefined\\\",4120],[[\\\"$\\\",\\\"$L7\\\",\\\"layout\\\",{\\\"type\\\":\\\"layout\\\",\\\"pagePath\\\":\\\"layout.tsx\\\",\\\"children\\\":[\\\"$\\\",\\\"$9\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/src_app_globals_162hn9o.css\\\",\\\"precedence\\\":\\\"next_static/chunks/src_app_globals_162hn9o.css\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$a\\\",0],[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$b\\\",0],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$c\\\",0]],\\\"$d\\\"]},null,\\\"$8\\\",1]},null,\\\"$6\\\",0],{\\\"children\\\":[[\\\"$\\\",\\\"$L3c\\\",null,{\\\"loading\\\":[[\\\"$\\\",\\\"$L7\\\",\\\"c-loading\\\",{\\\"type\\\":\\\"loading\\\",\\\"pagePath\\\":\\\"branch/loading.tsx\\\",\\\"children\\\":\\\"$3e\\\"},null,\\\"$3d\\\",0],[],null],\\\"children\\\":[\\\"$\\\",\\\"$L7\\\",\\\"layout\\\",{\\\"type\\\":\\\"layout\\\",\\\"pagePath\\\":\\\"branch/layout.tsx\\\",\\\"children\\\":[\\\"$\\\",\\\"$9\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/src_071eol0._.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$44\\\",0],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/node_modules_1gi61-2._.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$45\\\",0]],[\\\"$\\\",\\\"$L47\\\",null,{\\\"Component\\\":\\\"$48\\\",\\\"slots\\\":{\\\"children\\\":[\\\"$\\\",\\\"$L1c\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$4a\\\",\\\"errorStyles\\\":[\\\"$\\\",\\\"$L7\\\",null,{\\\"type\\\":\\\"error\\\",\\\"pagePath\\\":\\\"branch/error.tsx\\\",\\\"children\\\":[]},null,\\\"$4b\\\",0],\\\"errorScripts\\\":[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/src_app_branch_error_tsx_034uu-n._.js\\\",\\\"async\\\":true},null,\\\"$4c\\\",0]],\\\"template\\\":[\\\"$\\\",\\\"$L21\\\",null,{},null,\\\"$4d\\\",1],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\",\\\"segmentViewBoundaries\\\":[\\\"$undefined\\\",[\\\"$\\\",\\\"$L7\\\",null,{\\\"type\\\":\\\"boundary:loading\\\",\\\"pagePath\\\":\\\"branch/loading.tsx@boundary\\\"},null,\\\"$4e\\\",1],[\\\"$\\\",\\\"$L7\\\",null,{\\\"type\\\":\\\"boundary:error\\\",\\\"pagePath\\\":\\\"branch/error.tsx@boundary\\\"},null,\\\"$4f\\\",1],\\\"$undefined\\\"]},null,\\\"$49\\\",0]},\\\"serverProvidedParams\\\":{\\\"params\\\":{},\\\"promises\\\":null}},null,\\\"$46\\\",1]]},null,\\\"$43\\\",1]},null,\\\"$42\\\",0]},null,\\\"$3b\\\",2],{\\\"children\\\":[[\\\"$\\\",\\\"$9\\\",\\\"c\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$L1c\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L21\\\",null,{},null,\\\"$52\\\",1],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\",\\\"segmentViewBoundaries\\\":[\\\"$undefined\\\",\\\"$undefined\\\",\\\"$undefined\\\",\\\"$undefined\\\"]},null,\\\"$51\\\",1]]},null,\\\"$50\\\",0],{\\\"children\\\":[[\\\"$\\\",\\\"$9\\\",\\\"c\\\",{\\\"children\\\":[[\\\"$\\\",\\\"$L7\\\",\\\"c-page\\\",{\\\"type\\\":\\\"page\\\",\\\"pagePath\\\":\\\"branch/students/page.tsx\\\",\\\"children\\\":\\\"$55\\\"},null,\\\"$54\\\",1],[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/src_11c9w1m._.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$5d\\\",0],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/node_modules_0kz1xs1._.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$5e\\\",0]],\\\"$5f\\\"]},null,\\\"$53\\\",0],{},null,false,null]},null,false,\\\"$68\\\"]},null,false,null]},null,false,null],[\\\"$\\\",\\\"$9\\\",\\\"h\\\",{\\\"children\\\":[\\\"$6a\\\",\\\"$6f\\\",\\\"$78\\\",null]},null,\\\"$69\\\",0],false]],\\\"m\\\":\\\"$W83\\\",\\\"G\\\":[\\\"$84\\\",[\\\"$\\\",\\\"$L7\\\",\\\"ge-svn\\\",{\\\"type\\\":\\\"global-error\\\",\\\"pagePath\\\":\\\"global-error.tsx\\\",\\\"children\\\":[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/src_app_globals_162hn9o.css\\\",\\\"precedence\\\":\\\"next_static/chunks/src_app_globals_162hn9o.css\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"},null,\\\"$86\\\",0]]},null,\\\"$85\\\",0]],\\\"S\\\":false,\\\"h\\\":null,\\\"r\\\":\\\"$undefined\\\",\\\"s\\\":\\\"$undefined\\\",\\\"a\\\":\\\"$undefined\\\",\\\"l\\\":\\\"$undefined\\\",\\\"p\\\":\\\"$undefined\\\",\\\"d\\\":\\\"$undefined\\\",\\\"b\\\":\\\"development\\\"}\\n68:C\\n75:D\\\"$87\\\"\\n75:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"charSet\\\":\\\"utf-8\\\"},\\\"$60\\\",\\\"$88\\\",0],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"},\\\"$60\\\",\\\"$89\\\",0]]\\n92:I[\\\"[project]/node_modules/next/dist/lib/metadata/generate/icon-mark.js [app-client] (ecmascript)\\\",[\\\"/_next/static/chunks/src_0l43i1z._.js\\\",\\\"/_next/static/chunks/node_modules_14c2pbh._.js\\\"],\\\"IconMark\\\"]\\n67:D\\\"$8a\\\"\\n67:null\\n80:D\\\"$8b\\\"\\n80:[[\\\"$\\\",\\\"title\\\",\\\"0\\\",{\\\"children\\\":\\\"SchoolERP - School Management System\\\"},\\\"$60\\\",\\\"$8c\\\",0],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"description\\\",\\\"content\\\":\\\"Complete school management platform for administrators, teachers, and parents\\\"},\\\"$60\\\",\\\"$8d\\\",0],[\\\"$\\\",\\\"link\\\",\\\"2\\\",{\\\"rel\\\":\\\"shortcut icon\\\",\\\"href\\\":\\\"/screen.png?v=2\\\"},\\\"$60\\\",\\\"$8e\\\",0],[\\\"$\\\",\\\"link\\\",\\\"3\\\",{\\\"rel\\\":\\\"icon\\\",\\\"href\\\":\\\"/screen.png?v=2\\\"},\\\"$60\\\",\\\"$8f\\\",0],[\\\"$\\\",\\\"link\\\",\\\"4\\\",{\\\"rel\\\":\\\"apple-touch-icon\\\",\\\"href\\\":\\\"/screen.png?v=2\\\"},\\\"$60\\\",\\\"$90\\\",0],[\\\"$\\\",\\\"$L92\\\",\\\"5\\\",{},\\\"$60\\\",\\\"$91\\\",0]]\\n\"])"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - img "SchoolERP" [ref=e10]
        - generic [ref=e11]:
          - paragraph [ref=e12]: School Management System
          - paragraph
      - generic [ref=e13]: Branch office
      - heading "Run your campus operations." [level=1] [ref=e14]
      - paragraph [ref=e15]: Manage students, admissions, fees, staff and everyday school work from one dashboard.
      - generic [ref=e16]:
        - generic [ref=e17]: Student records
        - generic [ref=e20]: Admissions & fees
        - generic [ref=e23]: Gate attendance
        - generic [ref=e26]: Live reports
    - generic [ref=e30]:
      - generic [ref=e31]:
        - button "Staff" [pressed] [ref=e32]
        - button "Parent" [ref=e37]
        - button "Student" [ref=e42]
        - button "Admin" [ref=e47]
      - generic [ref=e53]:
        - generic [ref=e54]:
          - heading "Staff Portal" [level=2] [ref=e55]
          - paragraph [ref=e56]: Sign in with your school code and the credentials shared by the office.
        - generic [ref=e57]:
          - generic [ref=e58]:
            - generic [ref=e59]:
              - generic [ref=e60]: School Code
              - textbox "e.g. GULSHAN-01" [ref=e62]
            - generic [ref=e63]:
              - generic [ref=e64]: Email or Username*
              - textbox "you@example.com or username" [ref=e66]
            - generic [ref=e67]:
              - generic [ref=e68]: Password*
              - generic [ref=e69]:
                - textbox "••••••••" [ref=e70]
                - button "Show password" [ref=e72]
            - button "Sign in" [ref=e76]
          - link "Forgot password?" [ref=e78] [cursor=pointer]:
            - /url: /forgot-password
      - paragraph [ref=e80]: Having trouble signing in? Contact your school office.
  - button "Open Next.js Dev Tools" [ref=e86] [cursor=pointer]
  - alert [ref=e90]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE = 'http://localhost:3000';
  4   | 
  5   | async function waitForHydration(page: import('@playwright/test').Page) {
  6   |   await page.waitForLoadState('networkidle');
  7   |   await page.waitForTimeout(2000);
  8   | }
  9   | 
  10  | test.describe('Org Admin UI Flow', () => {
  11  |   test.describe('Login & Dashboard', () => {
  12  |     test('admin login with school code redirects to branch dashboard', async ({ browser }) => {
  13  |       const context = await browser.newContext();
  14  |       const page = await context.newPage();
  15  |       try {
  16  |         await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  17  |         // Wait for the hub form to hydrate instead of a fixed sleep
  18  |         await page.getByPlaceholder('you@example.com or username').waitFor({ state: 'visible', timeout: 20000 });
  19  | 
  20  |         await page.getByPlaceholder('e.g. GULSHAN-01').fill('DEMO-01');
  21  |         await page.getByPlaceholder('you@example.com or username').fill('admin.demo-01@seed.example.com');
  22  |         await page.getByPlaceholder('••••••••').fill('Admin@123');
  23  |         await page.getByRole('button', { name: 'Sign in' }).click();
  24  | 
  25  |         // First navigation compiles the dashboard route in dev — allow for it
  26  |         await page.waitForURL(/branch|dashboard/, { timeout: 45000 });
  27  |         expect(page.url()).toMatch(/branch|dashboard/);
  28  |       } finally {
  29  |         await context.close();
  30  |       }
  31  |     });
  32  | 
  33  |     test('dashboard loads without errors', async ({ page }) => {
  34  |       const errors: string[] = [];
  35  |       page.on('pageerror', (e) => errors.push(e.message));
  36  |       await page.goto(`${BASE}/branch/dashboard`, { waitUntil: 'domcontentloaded' });
  37  |       await waitForHydration(page);
  38  |       expect(errors).toEqual([]);
  39  |     });
  40  | 
  41  |     test('dashboard shows stats cards', async ({ page }) => {
  42  |       await page.goto(`${BASE}/branch/dashboard`);
  43  |       await waitForHydration(page);
  44  |       const body = await page.textContent('body');
  45  |       expect(body).toContain('Student');
  46  |     });
  47  |   });
  48  | 
  49  |   test.describe('Students Page', () => {
  50  |     test('students page loads', async ({ page }) => {
  51  |       await page.goto(`${BASE}/branch/students`);
  52  |       await waitForHydration(page);
  53  |       const body = await page.textContent('body');
  54  |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  55  |     });
  56  | 
  57  |     test('students page has correct heading', async ({ page }) => {
  58  |       await page.goto(`${BASE}/branch/students`);
  59  |       await waitForHydration(page);
  60  |       await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();
  61  |     });
  62  | 
  63  |     test('students page has add/import/export actions', async ({ page }) => {
  64  |       await page.goto(`${BASE}/branch/students`);
  65  |       await waitForHydration(page);
  66  |       const body = await page.textContent('body');
> 67  |       expect(body).toMatch(/Add|Import|Export/i);
      |                    ^ Error: expect(received).toMatch(expected)
  68  |     });
  69  |   });
  70  | 
  71  |   test.describe('Staff Page', () => {
  72  |     test('staff page loads', async ({ page }) => {
  73  |       await page.goto(`${BASE}/branch/staff`);
  74  |       await waitForHydration(page);
  75  |       const body = await page.textContent('body');
  76  |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  77  |     });
  78  | 
  79  |     test('staff page has correct heading', async ({ page }) => {
  80  |       await page.goto(`${BASE}/branch/staff`);
  81  |       await waitForHydration(page);
  82  |       await expect(page.getByRole('heading', { name: 'Staff Management' })).toBeVisible();
  83  |     });
  84  | 
  85  |     test('staff page has add staff button', async ({ page }) => {
  86  |       await page.goto(`${BASE}/branch/staff`);
  87  |       await waitForHydration(page);
  88  |       const body = await page.textContent('body');
  89  |       expect(body).toMatch(/Add Staff|Add User|New Staff/i);
  90  |     });
  91  |   });
  92  | 
  93  |   test.describe('Academic Page', () => {
  94  |     test('academic page loads', async ({ page }) => {
  95  |       await page.goto(`${BASE}/branch/academic`);
  96  |       await waitForHydration(page);
  97  |       const body = await page.textContent('body');
  98  |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  99  |     });
  100 | 
  101 |     test('academic page shows step tabs', async ({ page }) => {
  102 |       await page.goto(`${BASE}/branch/academic`);
  103 |       await waitForHydration(page);
  104 |       await expect(page.getByRole('heading', { name: 'Academic Setup' })).toBeVisible();
  105 |       const body = await page.textContent('body');
  106 |       expect(body).toContain('Academic Year');
  107 |       expect(body).toContain('Classes');
  108 |       expect(body).toContain('Subjects');
  109 |     });
  110 |   });
  111 | 
  112 |   test.describe('Fee Structures Page', () => {
  113 |     test('fee structures page loads', async ({ page }) => {
  114 |       await page.goto(`${BASE}/branch/fees/structures`);
  115 |       await waitForHydration(page);
  116 |       const body = await page.textContent('body');
  117 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  118 |     });
  119 | 
  120 |     test('fee structures page has correct heading', async ({ page }) => {
  121 |       await page.goto(`${BASE}/branch/fees/structures`);
  122 |       await waitForHydration(page);
  123 |       await expect(page.getByRole('heading', { name: 'Fee Structures', exact: true })).toBeVisible();
  124 |     });
  125 |   });
  126 | 
  127 |   test.describe('Fee Records Page', () => {
  128 |     test('fee records page loads', async ({ page }) => {
  129 |       await page.goto(`${BASE}/branch/fees/records`);
  130 |       await waitForHydration(page);
  131 |       const body = await page.textContent('body');
  132 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  133 |     });
  134 |   });
  135 | 
  136 |   test.describe('Fee Collection Page', () => {
  137 |     test('fee collection page loads', async ({ page }) => {
  138 |       await page.goto(`${BASE}/branch/fees/collection`);
  139 |       await waitForHydration(page);
  140 |       const body = await page.textContent('body');
  141 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  142 |     });
  143 |   });
  144 | 
  145 |   test.describe('Attendance Pages', () => {
  146 |     test('attendance records page loads with tabs', async ({ page }) => {
  147 |       await page.goto(`${BASE}/branch/attendance/records`);
  148 |       await waitForHydration(page);
  149 |       await expect(page.getByText('Daily View')).toBeVisible();
  150 |       await expect(page.getByText('Monthly View')).toBeVisible();
  151 |     });
  152 | 
  153 |     test('live attendance page loads', async ({ page }) => {
  154 |       await page.goto(`${BASE}/branch/attendance/live`);
  155 |       await waitForHydration(page);
  156 |       const body = await page.textContent('body');
  157 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  158 |     });
  159 | 
  160 |     test('gate scanner page loads', async ({ page }) => {
  161 |       await page.goto(`${BASE}/branch/attendance/gate`);
  162 |       await waitForHydration(page);
  163 |       const body = await page.textContent('body');
  164 |       expect(body).not.toMatch(/TypeError|Cannot read properties/i);
  165 |     });
  166 |   });
  167 | 
```