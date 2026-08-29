package com.hyecuts.loyalty.migration;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Guards DB-003: every column an entity maps must be declared by a migration.
 *
 * <p>Seven {@code users} columns — username, dob, phone, hair_type, hair_length,
 * hair_scalp, avatar — existed in production only because {@code ddl-auto: update}
 * created them. No migration mentioned them, so a Flyway-only rebuild produced a
 * schema the application could not start against, and nothing in the build said so.
 *
 * <p>This runs without a database on purpose. A test needing Postgres would not run
 * here at all (no Docker in this environment), and the defect is a static
 * inconsistency between two files in the repo, so it can be caught statically. It
 * is also the check that decides whether DB-001 is safe to act on: while it fails,
 * disabling {@code ddl-auto} breaks the app.
 */
class MigrationSchemaCoverageTest {

    private static final Path MIGRATIONS = Paths.get("src/main/resources/db/migration");

    // Not columns — the leading token of a table-level constraint clause.
    private static final Set<String> CONSTRAINT_KEYWORDS =
            Set.of("primary", "foreign", "unique", "constraint", "check", "exclude");

    // ---------- migration parsing ----------

    /** table -> columns the migrations actually declare, applied in version order. */
    private Map<String, Set<String>> parseMigrations() throws IOException {
        Map<String, Set<String>> schema = new HashMap<>();

        List<Path> files;
        try (Stream<Path> s = Files.list(MIGRATIONS)) {
            files = s.filter(p -> p.getFileName().toString().endsWith(".sql"))
                     .sorted(Comparator.comparingInt(MigrationSchemaCoverageTest::versionOf))
                     .toList();
        }

        for (Path file : files) {
            String sql = stripComments(Files.readString(file));

            for (String stmt : sql.split(";")) {
                String s = stmt.trim();
                if (s.isEmpty()) continue;
                String lower = s.toLowerCase(Locale.ROOT);

                if (lower.startsWith("create table")) {
                    applyCreateTable(schema, s);
                } else if (lower.startsWith("alter table")) {
                    applyAlterTable(schema, s, lower);
                } else if (lower.startsWith("drop table")) {
                    schema.remove(afterKeyword(lower, "drop table"));
                }
            }
        }
        return schema;
    }

    private void applyCreateTable(Map<String, Set<String>> schema, String stmt) {
        int open = stmt.indexOf('(');
        int close = stmt.lastIndexOf(')');
        if (open < 0 || close < open) return;

        String table = afterKeyword(stmt.substring(0, open).toLowerCase(Locale.ROOT), "create table");
        Set<String> cols = schema.computeIfAbsent(table, k -> new HashSet<>());

        for (String part : splitTopLevel(stmt.substring(open + 1, close))) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) continue;
            String first = trimmed.split("\\s+")[0].toLowerCase(Locale.ROOT);
            if (!CONSTRAINT_KEYWORDS.contains(first)) {
                cols.add(first);
            }
        }
    }

    private void applyAlterTable(Map<String, Set<String>> schema, String stmt, String lower) {
        String[] words = lower.replace("\n", " ").split("\\s+");
        // alter table <t> ...
        if (words.length < 3) return;
        String table = words[2];

        if (lower.contains(" add column")) {
            String col = tokenAfter(words, "column", Set.of("if", "not", "exists"));
            if (col != null) schema.computeIfAbsent(table, k -> new HashSet<>()).add(col);
        } else if (lower.contains(" drop column")) {
            String col = tokenAfter(words, "column", Set.of("if", "exists"));
            Set<String> cols = schema.get(table);
            if (col != null && cols != null) cols.remove(col);
        }
        // ALTER COLUMN ... (e.g. V9's DROP NOT NULL) changes no column *name*.
    }

    /** First token after {@code keyword}, skipping noise words like IF/NOT/EXISTS. */
    private String tokenAfter(String[] words, String keyword, Set<String> skip) {
        for (int i = 0; i < words.length - 1; i++) {
            if (words[i].equals(keyword)) {
                for (int j = i + 1; j < words.length; j++) {
                    if (!skip.contains(words[j])) return words[j];
                }
            }
        }
        return null;
    }

    private String afterKeyword(String lower, String keyword) {
        String rest = lower.substring(lower.indexOf(keyword) + keyword.length()).trim();
        rest = rest.replaceFirst("^if\\s+not\\s+exists\\s+", "")
                   .replaceFirst("^if\\s+exists\\s+", "");
        return rest.split("[\\s(]+")[0].replace("cascade", "").trim();
    }

    private String stripComments(String sql) {
        return sql.replaceAll("(?m)--.*$", "");
    }

    private List<String> splitTopLevel(String body) {
        List<String> parts = new ArrayList<>();
        int depth = 0, start = 0;
        for (int i = 0; i < body.length(); i++) {
            char c = body.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            else if (c == ',' && depth == 0) {
                parts.add(body.substring(start, i));
                start = i + 1;
            }
        }
        parts.add(body.substring(start));
        return parts;
    }

    private static int versionOf(Path p) {
        String name = p.getFileName().toString();
        return Integer.parseInt(name.substring(1, name.indexOf("__")));
    }

    // ---------- entity reflection ----------

    private record ExpectedColumn(String table, String column, String owner) {}

    private List<ExpectedColumn> expectedColumns() throws ClassNotFoundException {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(Entity.class));

        List<ExpectedColumn> expected = new ArrayList<>();
        for (BeanDefinition bd : scanner.findCandidateComponents("com.hyecuts.loyalty.model")) {
            Class<?> type = Class.forName(Objects.requireNonNull(bd.getBeanClassName()));
            String table = tableNameOf(type);

            for (Field f : type.getDeclaredFields()) {
                if (Modifier.isStatic(f.getModifiers())) continue;
                if (f.isAnnotationPresent(Transient.class)) continue;
                // Owned by the other side — no column on this table.
                if (f.isAnnotationPresent(OneToMany.class) || f.isAnnotationPresent(ManyToMany.class)) continue;

                expected.add(new ExpectedColumn(table, columnNameOf(f), type.getSimpleName() + "." + f.getName()));
            }
        }
        return expected;
    }

    private String tableNameOf(Class<?> type) {
        Table t = type.getAnnotation(Table.class);
        if (t != null && !t.name().isBlank()) return t.name().toLowerCase(Locale.ROOT);
        return toSnakeCase(type.getSimpleName());
    }

    private String columnNameOf(Field f) {
        JoinColumn jc = f.getAnnotation(JoinColumn.class);
        if (jc != null && !jc.name().isBlank()) return jc.name().toLowerCase(Locale.ROOT);
        Column c = f.getAnnotation(Column.class);
        if (c != null && !c.name().isBlank()) return c.name().toLowerCase(Locale.ROOT);
        return toSnakeCase(f.getName());
    }

    /** Mirrors Spring Boot's default CamelCaseToUnderscoresNamingStrategy. */
    private String toSnakeCase(String name) {
        return name.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase(Locale.ROOT);
    }

    // ---------- the test ----------

    @Test
    void everyEntityColumnIsDeclaredByAMigration() throws Exception {
        Map<String, Set<String>> schema = parseMigrations();
        List<String> missing = new ArrayList<>();

        for (ExpectedColumn ec : expectedColumns()) {
            Set<String> cols = schema.get(ec.table());
            if (cols == null) {
                missing.add(ec.owner() + " -> no migration creates table '" + ec.table() + "'");
            } else if (!cols.contains(ec.column())) {
                missing.add(ec.owner() + " -> " + ec.table() + "." + ec.column() + " is in no migration");
            }
        }

        assertTrue(missing.isEmpty(),
                "These columns exist only because ddl-auto creates them, so a Flyway-only "
                        + "rebuild would fail (DB-003). Add them to a migration:\n  "
                        + String.join("\n  ", missing));
    }

    @Test
    void parserSanityCheck() throws Exception {
        // If the parser silently matched nothing, the test above would pass
        // vacuously and re-open DB-003 without anyone noticing.
        Map<String, Set<String>> schema = parseMigrations();

        assertTrue(schema.containsKey("users"), "expected a users table");
        assertTrue(schema.get("users").contains("email"), "CREATE TABLE columns should parse");
        assertTrue(schema.get("users").contains("tier"), "ALTER TABLE ADD COLUMN should parse");
        assertTrue(schema.get("users").contains("username"), "V11 columns should parse");
        assertFalse(schema.get("users").contains("tier_id"), "DROP COLUMN should be applied");
        assertFalse(schema.containsKey("tiers"), "DROP TABLE should be applied");
        assertTrue(schema.get("bookings").contains("guest_email"));
        assertFalse(schema.get("users").contains("primary"), "constraint clauses are not columns");
    }
}
