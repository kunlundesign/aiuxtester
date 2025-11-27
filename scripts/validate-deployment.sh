#!/bin/bash
# Azure Functions 预部署验证脚本
# 使用方法: ./scripts/validate-deployment.sh

set -e

echo "========================================"
echo "Azure Functions 部署验证"
echo "========================================"
echo ""

API_DIR="api"
ERRORS=0

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. 检查 host.json
echo "1. 检查 host.json..."
if [ -f "$API_DIR/host.json" ]; then
    # 验证 JSON 格式
    if python3 -c "import json; json.load(open('$API_DIR/host.json'))" 2>/dev/null; then
        # 检查版本
        VERSION=$(python3 -c "import json; print(json.load(open('$API_DIR/host.json')).get('version', 'MISSING'))")
        if [ "$VERSION" == "2.0" ]; then
            success "host.json 存在且版本为 2.0"
        else
            error "host.json version 应该是 '2.0'，当前是 '$VERSION'"
        fi
    else
        error "host.json JSON 格式无效"
    fi
else
    error "host.json 不存在于 $API_DIR/"
fi

# 2. 检查 package.json
echo ""
echo "2. 检查 package.json..."
if [ -f "$API_DIR/package.json" ]; then
    success "package.json 存在"
    
    # 检查主入口
    MAIN=$(python3 -c "import json; print(json.load(open('$API_DIR/package.json')).get('main', 'MISSING'))" 2>/dev/null)
    if [ "$MAIN" != "MISSING" ]; then
        success "main 入口: $MAIN"
    else
        warning "package.json 缺少 'main' 字段"
    fi
else
    error "package.json 不存在于 $API_DIR/"
fi

# 3. 检查 tsconfig.json
echo ""
echo "3. 检查 tsconfig.json..."
if [ -f "$API_DIR/tsconfig.json" ]; then
    success "tsconfig.json 存在"
else
    error "tsconfig.json 不存在于 $API_DIR/"
fi

# 4. 检查编译输出
echo ""
echo "4. 检查编译输出..."
if [ -d "$API_DIR/dist" ]; then
    if [ -d "$API_DIR/dist/functions" ]; then
        FUNC_COUNT=$(ls -1 "$API_DIR/dist/functions" 2>/dev/null | wc -l)
        success "dist/functions 存在，包含 $FUNC_COUNT 个函数"
        echo "   函数列表:"
        for f in "$API_DIR/dist/functions"/*.js; do
            if [ -f "$f" ]; then
                echo "   - $(basename "$f" .js)"
            fi
        done
    else
        error "dist/functions 目录不存在，请运行 'npm run build'"
    fi
else
    error "dist 目录不存在，请运行 'npm run build'"
fi

# 5. 检查 local.settings.json 不在 git 中
echo ""
echo "5. 检查敏感文件..."
if [ -f "$API_DIR/local.settings.json" ]; then
    # 检查是否在 .gitignore 中
    if grep -q "local.settings.json" ".gitignore" 2>/dev/null; then
        success "local.settings.json 存在但已在 .gitignore 中排除"
    else
        warning "local.settings.json 存在但未在 .gitignore 中排除"
    fi
else
    success "local.settings.json 不存在（生产环境使用应用程序设置）"
fi

# 6. 检查 .funcignore
echo ""
echo "6. 检查 .funcignore..."
if [ -f "$API_DIR/.funcignore" ]; then
    success ".funcignore 存在"
else
    warning ".funcignore 不存在（建议添加以排除不必要的文件）"
fi

# 7. 验证函数注册（检查 v4 模式）
echo ""
echo "7. 验证 Azure Functions v4 编程模型..."
if grep -r "app.http\|app.timer\|app.storageBlob" "$API_DIR/src/functions" >/dev/null 2>&1; then
    success "使用 Azure Functions v4 编程模型 (app.* 注册)"
else
    warning "未检测到 v4 编程模型，请确保函数正确注册"
fi

# 总结
echo ""
echo "========================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}验证通过！可以安全部署。${NC}"
    exit 0
else
    echo -e "${RED}发现 $ERRORS 个错误，请修复后再部署。${NC}"
    exit 1
fi
