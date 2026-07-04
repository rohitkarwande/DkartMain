const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replaceWith) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log("Missing:", fullPath);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(searchRegex, replaceWith);
    fs.writeFileSync(fullPath, content);
}

replaceInFile('src/components/layout/DashboardLayout.tsx', /MessageSquare,\s*/g, '');
replaceInFile('src/components/layout/TopNavbar.tsx', /import { AdminNotifications } from ".\/AdminNotifications";\n/g, '');
replaceInFile('src/components/layout/TopNavbar.tsx', /\s*const isAdmin = user\?.role === 'admin';\n/g, '\n');
replaceInFile('src/pages/admin/AdminLayout.tsx', /import { AdminNotifications } from "@\/components\/layout\/AdminNotifications";\n/g, '');
replaceInFile('src/pages/admin/AdminLayout.tsx', /\(stats as Record<string, number>\)/g, '(stats as unknown as Record<string, number>)');
replaceInFile('src/pages/admin/AdminSecurity.tsx', /\s*Trash2,/g, '');
replaceInFile('src/pages/admin/AdminUsers.tsx', /\s*Filter,/g, '');
replaceInFile('src/pages/admin/DealFunnel.tsx', /\s*CheckCircle2,/g, '');
replaceInFile('src/pages/admin/DealFunnel.tsx', /\s*XCircle,/g, '');
replaceInFile('src/pages/admin/DealFunnel.tsx', /function FunnelStep/g, 'export function FunnelStep');
replaceInFile('src/pages/admin/KycApplications.tsx', /\s*ChevronLeft,/g, '');
replaceInFile('src/pages/admin/KycApplications.tsx', /import { Badge } from "@\/components\/ui\/badge";\n/g, '');
replaceInFile('src/pages/auth/KycVerification.tsx', /\s*const navigate = useNavigate\(\);\n/g, '\n');
replaceInFile('src/pages/dashboard/Chat.tsx', /\.includes\(activeRoom\.inquiry_status\)/g, '.includes((activeRoom as any).inquiry_status)');
replaceInFile('src/pages/dashboard/Inquiries.tsx', /import { useState } from "react";\n/g, '');
replaceInFile('src/pages/dashboard/Inquiries.tsx', /useState,\s*/g, '');
replaceInFile('src/pages/dashboard/Listings.tsx', /\s*Archive,/g, '');
replaceInFile('src/pages/dashboard/Profile.tsx', /const { user, setUser } = useAuth\(\);/g, 'const { data: user } = useAuth();\n  const queryClient = useQueryClient();');
replaceInFile('src/pages/dashboard/Profile.tsx', /setUser\(\{ \.\.\.user, email: data\.email, phone: data\.phone \}\);/g, 'queryClient.setQueryData([\'user\'], { ...user, email: data.email, phone: data.phone });');
replaceInFile('src/pages/dashboard/Profile.tsx', /import { Loader2,/g, 'import { useQueryClient } from "@tanstack/react-query";\nimport { Loader2,');
replaceInFile('src/pages/marketplace/EquipmentDetails.tsx', /import type { Equipment } from "@\/hooks\/useEquipment";\n/g, '');
replaceInFile('src/pages/marketplace/EquipmentDetails.tsx', / Phone,/g, '');
replaceInFile('src/pages/marketplace/EquipmentDetails.tsx', / Building2,/g, '');
replaceInFile('src/pages/marketplace/Search.tsx', /useState, useEffect/g, 'useState');
replaceInFile('src/pages/marketplace/Search.tsx', /import { Label } from "@\/components\/ui\/label";\n/g, '');
console.log("Done");
